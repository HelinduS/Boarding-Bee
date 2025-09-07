"use client";

import {useState} from "react";
import Link from "next/link";
import {User, Users, Package, Truck, LayoutDashboard, ClipboardList, LogOut, Menu, ChevronLeft, ShoppingBasket} from "lucide-react";
import { Item } from "@radix-ui/react-select";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return(
        <>

            <button
                className="m-4 md:hidden text-gray-900 dark:text-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                    <Menu size={30} />
                    </button>


            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white transform ${
                    isOpen ? "translate-x-0" : "-translate-x-64"
                } transition-transform md:relative md:translate-x-0 md:flex md:flex-col h-screen`}
            >
                <button
                    className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-lg md:hidden"
                    onClick={() => setIsOpen(false)}
                >
                    <ChevronLeft size={24}/>
                </button>

                <div className="p-6 text-xl font-bold border-b border-gray-700">
                    Admin Panel
                </div>


                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <Link href="/userprofile"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <User size={18}/>
                                <span>Profile</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/admindas/customers"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <Users size={18}/>
                                <span>Customers</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/admindas/orders"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <Package size={18}/>
                                <span>Orders</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/deliverydashboard"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <Truck size={18}/>
                                <span>Deliveries</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/admindas/dashboard"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <LayoutDashboard size={18}/>
                                <span>Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/admindas/inventory"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <ClipboardList size={18}/>
                                <span>Inventory</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/admindas/products"
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                                <ShoppingBasket size={18}/>
                                <span>Products</span>
                            </Link>
                        </li>

                    </ul>
                </nav>


                <div className="p-4 border-t border-gray-700">
                    <Link href="/login" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800">
                        <LogOut size={18}/>
                        <span>Logout</span>
                    </Link>
                </div>
            </aside>

        </>
    );
}
