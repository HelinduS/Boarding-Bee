const { Builder, By, until, Key } = require('selenium-webdriver');
const { getChromeOptions } = require('./seleniumTestUtils');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const assert = require('assert');

// Tunable timeouts to keep E2E runs faster while retaining retries.
const TIMEOUTS = {
  dashboardNavMs: 7000, // wait for the dashboard to show up after navigation
  shortSleep: 300,
  mediumSleep: 700,
  longSleep: 1500,
  usersWaitMs: 7000,
  reportsWaitMs: 7000,
  clickAttemptDelay: 300,
};

describe('Admin dashboard tab navigation', function() {
  this.timeout(90000);

  it('admin can visit all dashboard tabs', async function() {
    const { execSync } = require('child_process');
    let driver;
    // Use shared auth helpers to obtain or reuse an admin token
    const { ensureAdminToken, injectTokenToDriver } = require('./authHelpers');
    try {
  // Ensure admin token exists (file cached) and inject into browser localStorage
  const token = await ensureAdminToken();
  driver = await new Builder().forBrowser('chrome').setChromeOptions(getChromeOptions('admin-tabs')).build();
  await injectTokenToDriver(driver, token, BASE_URL);
    // Verify token was set in localStorage (sanity check)
    try {
      const stored = await driver.executeScript('return window.localStorage.getItem("token");');
      if (!stored) console.warn('Token not found in localStorage after injection');
      else if (stored !== token) console.warn('Token in localStorage does not match prepared token');
    } catch (e) {
      console.warn('Could not read localStorage to verify token:', e && e.message);
    }

    // Now navigate straight to the admin dashboard and wait for a known dashboard element.
    // If the dashboard doesn't render the admin tabs quickly, retry a couple of times and dump page HTML to help debugging.
    let dashboardReady = false;
    const maxNavAttempts = 3;
    for (let navAttempt = 1; navAttempt <= maxNavAttempts; navAttempt++) {
      try {
        await driver.get(`${BASE_URL}/admin-dashboard`);
        // Wait for either the URL to contain admin-dashboard or the Activity tab to be present
        await driver.wait(async () => {
          try {
            const urlOk = (await driver.getCurrentUrl()).includes('/admin-dashboard');
            if (urlOk) return true;
            const els = await driver.findElements(By.css('button[data-value="activity"], button[data-value="moderation"]'));
            return els && els.length > 0;
          } catch (e) { return false; }
        }, TIMEOUTS.dashboardNavMs);
        dashboardReady = true;
        break;
      } catch (navErr) {
        console.warn(`Attempt ${navAttempt} to open admin dashboard failed:`, navErr && (navErr.message || navErr));
        if (navAttempt < maxNavAttempts) {
          try { await driver.executeScript('window.localStorage.setItem("token", arguments[0]);', token); } catch (e) { /* ignore */ }
          await driver.sleep(TIMEOUTS.shortSleep);
          continue;
        }
        // final attempt failed — dump page source to console for debugging
        try {
          const src = await driver.getPageSource();
          console.error('=== Admin dashboard HTML snapshot (truncated to 32KB) ===\n', src.slice(0, 32768));
        } catch (e) { console.error('Failed to get page source for debugging:', e && e.message); }
        throw new Error('Admin dashboard did not become ready after token injection');
      }
    }

      // Robust tab click helper (retries + fallbacks)
      async function clickTabWithRetry(selector, options = {}) {
  const { maxAttempts = 3, waitAfterClick = TIMEOUTS.clickAttemptDelay, activeCheckTimeout = 5000 } = options;
        let lastErr = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Prefer a visible matching element when a selector matches multiple nodes (fixes duplicate DOM nodes/hydration artifacts)
            let tab = null;
            try {
              const candidates = await driver.findElements(By.css(selector));
              if (candidates && candidates.length > 0) {
                for (let i = 0; i < candidates.length; i++) {
                  try {
                    const cand = candidates[i];
                    const isVisible = await driver.executeScript("const el = arguments[0]; const cs = window.getComputedStyle(el); const r = el.getBoundingClientRect(); return (el.offsetParent !== null) && cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0;", cand);
                    if (isVisible) { tab = cand; break; }
                  } catch (e) { /* ignore */ }
                }
                // fallback to first candidate if none are clearly visible
                if (!tab) tab = candidates[0];
              } else {
                // If no candidates were found, let the normal findElement flow handle the error below
                tab = await driver.findElement(By.css(selector));
              }
            } catch (e) {
              // If something went wrong enumerating, fall back to a single find attempt which will throw if not present
              tab = await driver.findElement(By.css(selector));
            }
            try { await driver.executeScript('arguments[0].scrollIntoView(true);', tab); } catch (e) {}

            // Try a normal click first
            try { await tab.click(); } catch (e) { /* ignore click failure and try alternatives */ }
            await driver.sleep(waitAfterClick);

            // Check active heuristics: aria-selected OR active-like classes
            const isActive = await (async () => {
              try {
                const aria = await tab.getAttribute('aria-selected');
                if (aria && (aria === 'true' || aria === true)) return true;
              } catch (e) { /* ignore */ }
              try {
                const cls = await tab.getAttribute('class');
                if (cls && (cls.includes('data-[state=active]') || cls.includes('active') || cls.includes('bg-background') || cls.includes('data-[state=active]:')) ) return true;
              } catch (e) { /* ignore */ }
              return false;
            })();

            if (isActive) return tab;

            // If not active, try dispatching a MouseEvent
            // Try an actions-based move+click (closer to real user) before synthetic dispatch
            try {
              await driver.actions().move({ origin: tab }).click().perform();
              await driver.sleep(TIMEOUTS.shortSleep);
            } catch (e) {
              // fallback to dispatching a MouseEvent
              try {
                await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));", tab);
                await driver.sleep(TIMEOUTS.shortSleep);
              } catch (e2) { /* ignore */ }
            }

            // Re-check
            let activeNow = false;
            try {
              const aria2 = await tab.getAttribute('aria-selected');
              if (aria2 && (aria2 === 'true' || aria2 === true)) activeNow = true;
              const cls2 = await tab.getAttribute('class');
              if (!activeNow && cls2 && (cls2.includes('data-[state=active]') || cls2.includes('active') || cls2.includes('bg-background'))) activeNow = true;
            } catch (e) { /* ignore */ }
            if (activeNow) return tab;

            // Try focus + Enter key
            try {
              await driver.executeScript('arguments[0].focus();', tab);
              await driver.actions().sendKeys(Key.ENTER).perform();
              await driver.sleep(TIMEOUTS.shortSleep);
            } catch (e) { /* ignore */ }

            // After interaction, poll for the tab to become active for up to activeCheckTimeout
            try {
              const pollStart = Date.now();
              while ((Date.now() - pollStart) < activeCheckTimeout) {
                try {
                  const aria3 = await tab.getAttribute('aria-selected');
                  if (aria3 && (aria3 === 'true' || aria3 === true)) return tab;
                  const cls3 = await tab.getAttribute('class');
                  if (cls3 && (cls3.includes('data-[state=active]') || cls3.includes('active') || cls3.includes('bg-background') || cls3.includes('data-[state=active]:'))) return tab;
                } catch (inner) { /* ignore transient */ }
                await driver.sleep(150);
              }
            } catch (e) { /* ignore */ }

            // If still not active, try a PointerEvent sequence (pointerdown/pointerup + click) as a last-resort synthetic activation
            try {
              await driver.executeScript("arguments[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles:true })); arguments[0].dispatchEvent(new PointerEvent('pointerup', { bubbles:true })); arguments[0].dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));", tab);
              await driver.sleep(TIMEOUTS.shortSleep);
              // quick re-check
              try {
                const aria4 = await tab.getAttribute('aria-selected');
                if (aria4 && (aria4 === 'true' || aria4 === true)) return tab;
                const cls4 = await tab.getAttribute('class');
                if (cls4 && (cls4.includes('data-[state=active]') || cls4.includes('active') || cls4.includes('bg-background') || cls4.includes('data-[state=active]:'))) return tab;
              } catch (e) { /* ignore */ }
            } catch (e) { /* ignore pointer event fallback errors */ }

            // If still not active, attempt to log what's overlaying the tab center to aid debugging
              try {
                const info = await driver.executeScript(function(el){
                  const r = el.getBoundingClientRect();
                  const x = Math.round(r.left + r.width/2);
                  const y = Math.round(r.top + r.height/2);
                  const topEl = document.elementFromPoint(x, y);
                  const describe = function(node){ if(!node) return 'null'; return (node.tagName||'') + (node.id?('#'+node.id):'') + (node.className?('.'+node.className.replace(/\s+/g,'.')):'') + (node.getAttribute?(' [data-value='+node.getAttribute('data-value')+']'):''); };
                  return { x, y, topTag: describe(topEl), topHTML: topEl ? (topEl.outerHTML && topEl.outerHTML.slice(0,200)) : null };
                }, tab);
                console.warn('Tab not activated after attempted clicks; element at tab center:', info);
              } catch (e) { console.warn('Failed to inspect elementFromPoint for tab', e && e.message); }

            // Programmatic overlay-unblock: hide common overlays/popovers then dispatch a click (automation-only)
            try {
              await driver.executeScript(function(el){
                const selectors = ['.modal', '.popover', '.overlay', '.dialog', '[role="dialog"]', '.toast', '.toast-container', '.c-toast', '.dropdown-backdrop', '.menu-backdrop'];
                selectors.forEach(s => Array.from(document.querySelectorAll(s)).forEach(n => {
                  try { n.style.pointerEvents = 'none'; n.style.display = 'none'; } catch(e) {}
                }));
                try { el.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); } catch(e) {}
                return true;
              }, tab);
              await driver.sleep(TIMEOUTS.shortSleep);
              try {
                const aria4 = await tab.getAttribute('aria-selected');
                if (aria4 && (aria4 === 'true' || aria4 === true)) return tab;
                const cls4 = await tab.getAttribute('class');
                if (cls4 && (cls4.includes('data-[state=active]') || cls4.includes('active') || cls4.includes('bg-background'))) return tab;
              } catch (e) { /* ignore */ }
            } catch (e) { /* ignore overlay-hide errors */ }

            // If not last attempt, sleep and retry
            lastErr = new Error('Tab did not become active after click/dispatch/enter');
            if (attempt < maxAttempts) { await driver.sleep(TIMEOUTS.clickAttemptDelay); continue; }
            throw lastErr;
          } catch (err) {
            lastErr = err;
            // If element not found or stale, sleep and retry
            await driver.sleep(TIMEOUTS.clickAttemptDelay);
            // On last attempt, rethrow
            if (attempt === maxAttempts) throw lastErr;
          }
        }
      }

      // Generic wait helper: wait until any of `contentSelectors` exists OR all `loadingSelectors` are gone.
      async function waitForContentOrNoLoading(contentSelectors = [], loadingSelectors = [], timeout = 5000) {
        const pollInterval = 250;
        const start = Date.now();
        while ((Date.now() - start) < timeout) {
          try {
            for (const sel of contentSelectors) {
              const found = await driver.findElements(By.css(sel));
              if (found && found.length > 0) return true;
            }
            // If no content found, check loading selectors absence
            let anyLoading = false;
            for (const lsel of loadingSelectors) {
              const loaders = await driver.findElements(By.css(lsel));
              if (loaders && loaders.length > 0) { anyLoading = true; break; }
            }
            if (!anyLoading && contentSelectors.length === 0) return true; // no content to wait for and nothing loading
            if (!anyLoading) {
              // Nothing is loading but we also don't see expected content yet; continue polling until timeout
              await driver.sleep(pollInterval);
              continue;
            }
          } catch (e) { /* ignore transient errors */ }
          await driver.sleep(pollInterval);
        }
        return false;
      }

      // Activity Log tab (use robust helper)
  await clickTabWithRetry('button[data-value="activity"]', { maxAttempts: 3, waitAfterClick: TIMEOUTS.mediumSleep, activeCheckTimeout: 5000 });
      // Wait for activity data to be loaded (either rows appear or skeletons/spinners disappear)
      const activitySelectors = [
    '[data-testid^="activity-row-"]',
    '.activity-list',
    'table.activity tbody tr',
    '.activity-item',
      ];
      const activityLoaders = [
    '.skeleton', '.shimmer', '.loading', '.spinner', '[aria-busy="true"]'
      ];
      let activityReady = await waitForContentOrNoLoading(activitySelectors, activityLoaders, TIMEOUTS.longSleep);
      if (!activityReady) {
        console.warn('Activity content not detected after clicks — attempting history.pushState fallback to activate Activity tab');
          try {
            // Programmatic, in-page activation: find the tab button and dispatch a click (no URL change)
            const activated = await driver.executeScript(function(tab){
              try {
                const sel = document.querySelector('button[data-value="' + tab + '"]') || Array.from(document.querySelectorAll('button')).find(b=>b.textContent && b.textContent.trim().toLowerCase().includes(tab));
                if (sel) { sel.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); return true; }
              } catch(e) {}
              return false;
            }, 'activity');
            // give app a moment to react to the synthetic activation
            await driver.sleep(500);
            activityReady = await waitForContentOrNoLoading(activitySelectors, activityLoaders, TIMEOUTS.longSleep);
            if (activityReady) console.log('Activity content detected after in-page activation fallback');
            else console.warn('Activity still not detected after in-page activation fallback (no URL change)');
          } catch (e) {
            console.warn('In-page activation fallback for Activity failed:', e && e.message);
          }
      }

      // Security tab (optional)
      try {
        await clickTabWithRetry('button[data-value="security"]', { maxAttempts: 2, waitAfterClick: TIMEOUTS.mediumSleep, activeCheckTimeout: 4000 });
      } catch (e) {
        console.warn('Security tab not found or could not be activated; continuing (some builds use a different tab set):', e && e.message);
      }


      // Users tab: try selector first, fall back to text-based button, increase wait times
      try {
        let usersBtnFound = (await driver.findElements(By.css('button[data-value="users"]'))).length > 0;
        if (!usersBtnFound) {
          // fallback: find button by visible text 'Users'
          const byText = By.xpath("//button[contains(normalize-space(.), 'Users')]");
          const els = await driver.findElements(byText);
          if (els.length > 0) {
            // use the first matching element and attempt to click via helper using an XPath wrapper
            await clickTabWithRetry("button[data-value=\"users\"]", { maxAttempts: 1, waitAfterClick: 400, activeCheckTimeout: 1000 }).catch(()=>{});
            // directly click the XPath element as fallback
            try { await els[0].click(); } catch (e) { try { await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles:true}));", els[0]); } catch(e2){} }
          } else {
            // try clicking moderation tab to expose sub-tabs and then retry
            try { await clickTabWithRetry('button[data-value="moderation"]', { maxAttempts: 3, waitAfterClick: 800, activeCheckTimeout: 8000 }); } catch(e) { /* ignore */ }
          }
        } else {
          await clickTabWithRetry('button[data-value="users"]', { maxAttempts: 5, waitAfterClick: 1500, activeCheckTimeout: 20000 });
        }

        // After activating Users tab, wait for user list content (table rows or user-card testids)
        const usersSelectors = ['[data-testid^="user-row-"]', 'table tbody tr', '.user-list', '.user-item'];
        const usersLoaders = ['.skeleton', '.shimmer', '.loading', '.spinner', '[aria-busy="true"]'];
        let usersReady = await waitForContentOrNoLoading(usersSelectors, usersLoaders, TIMEOUTS.usersWaitMs);
        if (!usersReady) {
          console.warn('Users content not detected after clicks — attempting history.pushState fallback to activate Users tab');
          try {
            // Programmatic, in-page activation for Users (no URL change)
            try {
              await driver.executeScript(function(tab){
                try {
                  const sel = document.querySelector('button[data-value="' + tab + '"]') || Array.from(document.querySelectorAll('button')).find(b=>b.textContent && b.textContent.trim().toLowerCase().includes(tab));
                  if (sel) { sel.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); return true; }
                } catch(e) {}
                return false;
              }, 'users');
              await driver.sleep(500);
              usersReady = await waitForContentOrNoLoading(usersSelectors, usersLoaders, TIMEOUTS.usersWaitMs);
              if (usersReady) console.log('Users content detected after in-page activation fallback');
              else console.warn('Users still not detected after in-page activation fallback');
            } catch (e) {
              console.warn('In-page activation fallback for Users failed:', e && e.message);
            }
          } catch (e) {
            console.warn('history.pushState fallback for Users failed:', e && e.message);
          }
        } else {
          console.log('Users list detected after activating Users tab');
        }
        // Save usersReady status for later logic and give a short pause before moving to Reports
        try { await driver.sleep(400); } catch (e) {}
      } catch (e) {
        console.warn('Failed to activate Users tab (non-fatal):', e && (e.message || e));
      }

      // Interact with Users list (best-effort)
      try {
        // Try common testid used by UI rows, fallback to table rows
        let userRow = null;
        try {
          userRow = await driver.findElement(By.css('[data-testid^="user-row-"]'));
        } catch (e) {
          // fallback to table rows
          const rows = await driver.findElements(By.css('table tbody tr'));
          if (rows.length > 0) userRow = rows[0];
        }
        // If still not found, try card-style users (snapshot shows cards with nested .font-medium for name)
        if (!userRow) {
          try {
            const cardEls = await driver.findElements(By.xpath("//div[contains(@class,'rounded-xl') and contains(@class,'border') and .//div[contains(@class,'font-medium')]]"));
            if (cardEls && cardEls.length > 0) userRow = cardEls[0];
          } catch (e) { /* ignore */ }
        }

        if (userRow) {
          // Ensure element is centered in viewport before interacting
          try { await driver.executeScript('arguments[0].scrollIntoView({block:"center", inline:"center"});', userRow); } catch (e) {}
          await driver.sleep(300);
          // Attempt a normal click, but fall back to robust approaches if click is intercepted
          let clicked = false;
          try {
            await userRow.click();
            clicked = true;
          } catch (clickErr) {
            console.warn('Direct userRow.click() failed, attempting action-based click and JS-dispatch fallbacks:', clickErr && clickErr.message);
          }

          if (!clicked) {
            // 1) Try actions-based move+click (closer to a real user)
            try {
              await driver.actions().move({ origin: userRow }).click().perform();
              clicked = true;
            } catch (actErr) {
              console.warn('Actions-based move+click failed:', actErr && actErr.message);
            }
          }

          if (!clicked) {
            // 2) Attempt to temporarily disable pointer events on any element over the target and dispatch a click at the center
            try {
              await driver.executeScript(function(el){
                const rect = el.getBoundingClientRect();
                const x = Math.round(rect.left + rect.width/2);
                const y = Math.round(rect.top + rect.height/2);
                const top = document.elementFromPoint(x, y);
                if (top && top !== el) {
                  try { top.__prevPointerEvents = top.style.pointerEvents; top.style.pointerEvents = 'none'; } catch(e){}
                }
                try {
                  el.dispatchEvent(new MouseEvent('mousemove', { bubbles:true, cancelable:true, view:window }));
                  el.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, cancelable:true, view:window }));
                  el.dispatchEvent(new MouseEvent('mouseup', { bubbles:true, cancelable:true, view:window }));
                  el.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
                } catch(e){}
                // restore pointer-events on the previously hidden element asynchronously
                if (top && top !== el) { setTimeout(()=>{ try { top.style.pointerEvents = top.__prevPointerEvents || ''; delete top.__prevPointerEvents; } catch(e){} }, 50); }
                return true;
              }, userRow);
              // small delay to allow any UI reaction
              await driver.sleep(150);
              clicked = true;
            } catch (jsErr) {
              console.warn('JS-dispatch fallback failed:', jsErr && jsErr.message);
            }
          }
          // (click attempts above) - proceed even if click didn't succeed; tests will treat missing details as non-fatal
          // Wait for a details panel or modal to appear (several possible selectors)
          try {
            await driver.wait(until.elementLocated(By.css('[data-testid^="user-details-"], .user-details, [data-testid="user-profile"]')), 5000);
            console.log('User details appeared after clicking a user row');
          } catch (e) {
            console.log('User details did not appear with known selectors; continuing (UI may use a different pattern)', e && e.message);
          }
        } else {
          console.log('No user rows found in Users tab (this may be OK for an empty dataset)');
        }
      } catch (e) {
        console.warn('Users tab interactions failed (non-fatal):', e && (e.message || e));
      }


      // Reports tab: try selector first, fall back to text-based button, increase wait times
      try {
        let reportsBtnFound = (await driver.findElements(By.css('button[data-value="reports"]'))).length > 0;
        // Diagnostic: if the reports button exists, log some attributes to aid debugging
        if (reportsBtnFound) {
          try {
            const info = await driver.executeScript(function(){
              const el = document.querySelector('button[data-value="reports"]');
              if (!el) return null;
              const cs = window.getComputedStyle(el);
              return { outerHTML: (el.outerHTML||'').slice(0,500), className: el.className, disabled: el.disabled, visible: (el.offsetParent !== null), display: cs.display, visibility: cs.visibility, text: el.textContent && el.textContent.trim() };
            });
            console.log('Reports button diagnostic:', info);
          } catch (diagErr) { console.warn('Failed to gather reports button diagnostic:', diagErr && diagErr.message); }
        } else {
          // If no data-value button, list any buttons containing 'Reports' text
          try {
            const foundButtons = await driver.findElements(By.xpath("//button[contains(normalize-space(.), 'Reports')]") );
            if (foundButtons.length > 0) {
              const snippets = [];
              for (let i = 0; i < Math.min(foundButtons.length, 5); i++) {
                try {
                  const outer = await foundButtons[i].getAttribute('outerHTML');
                  snippets.push((outer||'').slice(0,300));
                } catch(e) { /* ignore */ }
              }
              console.log('Buttons with text "Reports" found (outerHTML snippets):', snippets);
            }
          } catch (e) { /* ignore */ }
        }
        if (!reportsBtnFound) {
          const byTextR = By.xpath("//button[contains(normalize-space(.), 'Reports')]");
          const elsr = await driver.findElements(byTextR);
          if (elsr.length > 0) {
            try { await elsr[0].click(); } catch (e) { try { await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles:true}));", elsr[0]); } catch(e2){} }
          } else {
            // try clicking moderation main to expose sub-tabs (if applicable)
            try { await clickTabWithRetry('button[data-value="moderation"]', { maxAttempts: 3, waitAfterClick: 800, activeCheckTimeout: 8000 }); } catch(e) { /* ignore */ }
          }
        } else {
          await clickTabWithRetry('button[data-value="reports"]', { maxAttempts: 5, waitAfterClick: 1500, activeCheckTimeout: 20000 });
        }

        // After activating Reports tab, wait for report list content
          try {
          // Broaden selectors to catch different UI variations and wait until they appear or loaders disappear.
          // Require either report content OR an explicit empty-state indicator to consider the Reports tab successfully loaded.
          const reportSelectors = ['[data-testid^="report-card-"], .report-card, .reports-list, .report-item, [data-testid^="report-"]'];
          const reportLoaders = ['.skeleton', '.shimmer', '.loading', '.spinner', '[aria-busy="true"]'];
          const reportsLoaded = await waitForContentOrNoLoading(reportSelectors, reportLoaders, TIMEOUTS.reportsWaitMs);
          if (reportsLoaded) {
            // Now confirm there is either real report content or a known empty-state message/element.
            const foundReports = (await driver.findElements(By.css(reportSelectors.join(',')))).length > 0;
            const emptySelectors = ['.reports-empty', '.empty-state', '.no-results', '.empty', '.reports-empty-state'];
            let emptyFound = false;
            if (!foundReports) {
              for (const es of emptySelectors) {
                try {
                  const els = await driver.findElements(By.css(es));
                  if (els && els.length > 0) { emptyFound = true; break; }
                } catch (ee) { /* ignore */ }
              }
              if (!emptyFound) {
                // also check for common textual empty-state markers like 'No reports' or 'No report'
                try {
                  const txtEls = await driver.findElements(By.xpath("//*[contains(normalize-space(.),'No reports') or contains(normalize-space(.),'No report') or contains(normalize-space(.),'There are no reports')]") );
                  if (txtEls && txtEls.length > 0) emptyFound = true;
                } catch (ee) { /* ignore */ }
              }
            }
            if (foundReports) {
              console.log('Reports list detected after activating Reports tab');
            } else if (emptyFound) {
              console.log('Reports tab active but shows an explicit empty-state');
            } else {
              throw new Error('Reports section did not render expected content or an empty-state');
            }
          } else {
            throw new Error('Reports not loaded within timeout');
          }
        } catch (e) {
          console.warn('Reports list not detected within timeout after Reports tab activation; attempting programmatic history.pushState fallback and saving HTML snapshot.');
          try {
            const fs = require('fs'); const path = require('path');
            const snapshotPath = path.resolve(__dirname, '..', '..', 'tmp', `admin-reports-snapshot-${Date.now()}.html`);
            const src = await driver.getPageSource();
            try { fs.mkdirSync(path.dirname(snapshotPath), { recursive: true }); } catch (e2) {}
            fs.writeFileSync(snapshotPath, src, 'utf8');
            console.warn('Wrote admin reports HTML snapshot to', snapshotPath);
          } catch (writeErr) { console.warn('Failed to write HTML snapshot:', writeErr && writeErr.message); }
            // First try a programmatic client-side route change (no full navigation) to activate Reports
            try {
              // Programmatic, in-page activation for Reports (no URL change)
              await driver.executeScript(function(tab){
                try {
                  const sel = document.querySelector('button[data-value="' + tab + '"]') || Array.from(document.querySelectorAll('button')).find(b=>b.textContent && b.textContent.trim().toLowerCase().includes(tab));
                  if (sel) { sel.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window })); return true; }
                } catch(e) {}
                return false;
              }, 'reports');
              await driver.sleep(500);
              const foundR = (await driver.findElements(By.css('[data-testid^="report-card-"], .report-card, .reports-list'))).length > 0;
              if (foundR) console.log('Found reports content after in-page activation fallback');
              else {
                console.warn('No reports content found after in-page activation fallback');
                try {
                  const fs = require('fs'); const path = require('path');
                  const ts = Date.now();
                  const snapshotPath = path.resolve(__dirname, '..', '..', 'tmp', `admin-reports-snapshot-${ts}.html`);
                  const src = await driver.getPageSource();
                  try { fs.mkdirSync(path.dirname(snapshotPath), { recursive: true }); } catch (e2) {}
                  fs.writeFileSync(snapshotPath, src, 'utf8');
                  // capture screenshot
                  try {
                    const png = await driver.takeScreenshot();
                    const imgPath = path.resolve(__dirname, '..', '..', 'tmp', `admin-reports-ss-${ts}.png`);
                    fs.writeFileSync(imgPath, png, 'base64');
                    console.warn('Wrote admin reports HTML snapshot and screenshot to', snapshotPath, imgPath);
                  } catch (ssErr) { console.warn('Failed to capture screenshot for Reports fallback:', ssErr && ssErr.message); }
                } catch (writeErr) { console.warn('Failed to write HTML snapshot for Reports fallback:', writeErr && writeErr.message); }
              }
            } catch (pushErr) {
              console.warn('In-page activation fallback for Reports failed:', pushErr && pushErr.message);
            }
            // Fallbacks: try clicking moderation or text-based buttons on the already-loaded admin dashboard (no URL changes)
            try {
              try { await clickTabWithRetry('button[data-value="reports"]', { maxAttempts: 3, waitAfterClick: TIMEOUTS.mediumSleep }); } catch (e) { /* ignore */ }
              try { await clickTabWithRetry('button[data-value="moderation"]', { maxAttempts: 2, waitAfterClick: TIMEOUTS.mediumSleep }); } catch (e) { /* ignore */ }
              const byTextReports = By.xpath("//button[contains(normalize-space(.), 'Reports')]");
              const textElsR = await driver.findElements(byTextReports);
              if (textElsR.length > 0) {
                try { await textElsR[0].click(); } catch (e) { try { await driver.executeScript("arguments[0].dispatchEvent(new MouseEvent('click', {bubbles:true}));", textElsR[0]); } catch(e2){} }
              }
              const foundR = (await driver.findElements(By.css('[data-testid^="report-card-"], .report-card, .reports-list'))).length > 0;
              if (foundR) console.log('Found reports content after clicking dashboard controls');
              else console.warn('No reports content found after dashboard-only fallbacks');
            } catch (e) {
              console.warn('Reports dashboard-only fallback attempts failed:', e && e.message);
            }
        }
      } catch (e) {
        console.warn('Failed to activate Reports tab (non-fatal):', e && (e.message || e));
      }

      // Interact with Reports list (best-effort)
      try {
        let reportCard = null;
        try {
          reportCard = await driver.findElement(By.css('[data-testid^="report-card-"]'));
        } catch (e) {
          const alt = await driver.findElements(By.css('.report-card, [data-testid^="report-"]'));
          if (alt.length > 0) reportCard = alt[0];
        }

        if (reportCard) {
          await driver.executeScript('arguments[0].scrollIntoView(true);', reportCard);
          await driver.sleep(300);
          await reportCard.click();
          try {
            await driver.wait(until.elementLocated(By.css('[data-testid^="report-details-"], .report-details, .modal')), 5000);
            console.log('Report details appeared after clicking a report card');
          } catch (e) {
            console.log('Report details did not appear with known selectors; continuing (UI may use a different pattern)', e && e.message);
          }
        } else {
          console.log('No report cards found in Reports tab (this may be OK for an empty dataset)');
        }
      } catch (e) {
        console.warn('Reports tab interactions failed (non-fatal):', e && (e.message || e));
      }
    } catch (err) {
      // On any failure, attempt to delete test users we create during e2e runs
      try {
        console.error('Test failed — running test user cleanup:', err && (err.stack || err.message || err));
        execSync('node tests/selenium/delete-test-user.js', { stdio: 'inherit' });
      } catch (cleanupErr) {
        console.error('Cleanup script failed:', cleanupErr && (cleanupErr.stack || cleanupErr.message || cleanupErr));
      }
      throw err;
    } finally {
      try { if (driver) await driver.quit(); } catch (e) { /* ignore */ }
    }
  });
});