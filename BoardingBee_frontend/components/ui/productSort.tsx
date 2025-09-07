import React, { useState } from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface ProductSortDropdownProps {
  sortBy: string
  onSortChange: (value: string) => void
}

const ProductSortDropdown: React.FC<ProductSortDropdownProps> = ({ sortBy, onSortChange }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border p-2 rounded-md">
        Sort by: {sortBy}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={() => onSortChange("default")}>
          Default
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("nameAZ")}>
          Name: A to Z
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("nameZA")}>
          Name: Z to A
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("priceLowToHigh")}>
          Price: Low to High
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("priceHighToLow")}>
          Price: High to Low
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProductSortDropdown