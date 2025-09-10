"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Type for product
interface Product {
  id?: number;
  name: string;
  price: number;
  image?: string;
  stock: number;
}

// Props for this modal component
interface AddProductModalProps {
  trigger: React.ReactNode;         // The button that opens the modal
  productToEdit?: Product;          // Optional product passed in for editing
  onSave: (product: Product) => void; // Callback when saving
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddProductModal({
  trigger,
  productToEdit,
  onSave,
  open,
  onOpenChange,
}: AddProductModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [stock, setStock] = useState(0);

  useEffect(() => {
    if (open) {
      if (productToEdit) {
        setName(productToEdit.name);
        setPrice(productToEdit.price);
        setImage(productToEdit.image ?? "");
        setStock(productToEdit.stock);
      } else {
        setName("");
        setPrice(0);
        setImage("");
        setStock(0);
      }
    }
  }, [open, productToEdit]);

  const handleSave = () => {
    if (!name || price <= 0 || stock < 0) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const newProduct: Product = {
      id: productToEdit?.id,
      name,
      price,
      image,
      stock,
    };

    onSave(newProduct);
    onOpenChange?.(false); // Tell parent to close modal
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-md h-[600px]"
        aria-describedby="product-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>
            {productToEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        {/* This is the required accessible description */}
        <p id="product-dialog-description" className="text-sm text-muted-foreground mt-1">
          {productToEdit
            ? "Update the product details below."
            : "Fill in the form to add a new product."}
        </p>

        <div className="space-y-4 mt-4">
          <input type="text" placeholder="Product Name" className="w-full p-2 border rounded" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" placeholder="Price" className="w-full p-2 border rounded" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          <input type="text" placeholder="Image URL" className="w-full p-2 border rounded" value={image} onChange={(e) => setImage(e.target.value)} />
          <input type="number" placeholder="Stock" className="w-full p-2 border rounded" value={stock} onChange={(e) => setStock(Number(e.target.value))} />
        </div>

        <div className="mt-4">
          <Button onClick={handleSave} className="w-full">
            {productToEdit ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}