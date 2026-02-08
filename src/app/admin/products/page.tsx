"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2, Plus, Loader2, ImagePlus, ImageIcon, Download, Upload } from "lucide-react"

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "Price must be positive"),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface Product {
    id: string
    name: string
    description: string | null
    price: number
    imageUrl: string | null
    categoryId: string | null
    category: { name: string } | null
    shopId: string
    images: string[]
}

interface Category {
    id: string
    name: string
}

export default function ProductsPage() {
    const { t, language } = useLanguage()
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [imageUrl, setImageUrl] = useState<string>("")
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [currency, setCurrency] = useState("USD")

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            imageUrl: "",
        }
    })
    const [importing, setImporting] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState<string[]>([])
    const [bulkActionLoading, setBulkActionLoading] = useState(false)
    const [isBulkCategoryOpen, setIsBulkCategoryOpen] = useState(false)
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
    const [quickAddRows, setQuickAddRows] = useState([{ name: "", price: 0 }])

    const fetchData = async () => {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
            window.location.href = '/admin/login'
            return
        }

        try {
            const [prodRes, catRes, settingsRes] = await Promise.all([
                fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
            ])

            if (prodRes.ok) setProducts(await prodRes.json())
            if (catRes.ok) setCategories(await catRes.json())
            if (settingsRes.ok) {
                const settings = await settingsRes.json()
                setCurrency(settings.currency || "USD")
            }
        } catch (error) {
            console.error("Failed to fetch data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const startCreate = () => {
        setEditingProduct(null)
        setImageUrl("")
        form.reset({
            name: "",
            description: "",
            price: 0,
            categoryId: "none",
            imageUrl: ""
        })
        setIsDialogOpen(true)
    }

    const startEdit = (product: Product) => {
        setEditingProduct(product)
        setImageUrl(product.images?.[0] || product.imageUrl || "")
        form.reset({
            name: product.name,
            description: product.description || "",
            price: Number(product.price),
            categoryId: product.categoryId || "none",
            imageUrl: product.images?.[0] || product.imageUrl || ""
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('products.deleteConfirm'))) return // Fallback if shadcn dialog fails or for safety

        const token = localStorage.getItem('token')
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (res.ok) {
            fetchData()
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setImageUrl(data.url)
                form.setValue("imageUrl", data.url)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUploading(false)
        }
    }

    const onSubmit = async (data: ProductFormValues) => {
        setSaving(true)
        const token = localStorage.getItem('token')

        try {
            const payload = {
                ...data,
                categoryId: data.categoryId === "none" ? null : data.categoryId
            }

            if (editingProduct) {
                await fetch(`/api/products/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                })
            } else {
                await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                })
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleQuickAddChange = (index: number, field: string, value: any) => {
        const newRows = [...quickAddRows]
        // @ts-ignore
        newRows[index][field] = value
        setQuickAddRows(newRows)
    }

    const addQuickRow = () => {
        setQuickAddRows([...quickAddRows, { name: "", price: 0 }])
    }

    const removeQuickRow = (index: number) => {
        setQuickAddRows(quickAddRows.filter((_, i) => i !== index))
    }

    const handleQuickAddSubmit = async () => {
        setSaving(true)
        const token = localStorage.getItem('token')
        let count = 0
        try {
            for (const row of quickAddRows) {
                if (!row.name) continue
                await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: row.name, price: Number(row.price) })
                })
                count++
            }
            setIsQuickAddOpen(false)
            setQuickAddRows([{ name: "", price: 0 }])
            fetchData()
            alert(`Added ${count} products.`)
        } catch (e) {
            console.error(e)
            alert("Error during quick add.")
        } finally {
            setSaving(false)
        }
    }

    const toggleSelectAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts(products.map(p => p.id))
        }
    }

    const toggleSelect = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pid => pid !== id))
        } else {
            setSelectedProducts([...selectedProducts, id])
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return

        setBulkActionLoading(true)
        const token = localStorage.getItem('token')
        try {
            await Promise.all(selectedProducts.map(id =>
                fetch(`/api/products/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ))
            fetchData()
            setSelectedProducts([])
        } catch (e) {
            console.error(e)
            alert("Some products could not be deleted.")
        } finally {
            setBulkActionLoading(false)
        }
    }

    const handleBulkCategoryUpdate = async (categoryId: string | undefined) => {
        setBulkActionLoading(true)
        const token = localStorage.getItem('token')
        try {
            await Promise.all(selectedProducts.map(id =>
                fetch(`/api/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ categoryId })
                })
            ))
            fetchData()
            setSelectedProducts([])
            setIsBulkCategoryOpen(false)
        } catch (e) {
            console.error(e)
            alert("Failed to update categories.")
        } finally {
            setBulkActionLoading(false)
        }
    }

    const [exporting, setExporting] = useState(false)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

    const handleExport = async () => {
        setExporting(true)
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('/api/products/import-export', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!res.ok) throw new Error("Export failed")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = "products.xlsx"
            document.body.appendChild(a)
            a.click()
            a.remove()
        } catch (e) {
            console.error(e)
            alert("Export failed. Please try again.")
        } finally {
            setExporting(false)
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/products/import-export', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                alert(`Imported ${data.count} products successfully!`)
                fetchData()
                setIsImportDialogOpen(false)
            } else {
                const err = await res.json()
                alert(`Import failed: ${err.error}`)
            }
        } catch (e) {
            console.error(e)
            alert("Import failed with an unexpected error.")
        } finally {
            setImporting(false)
            e.target.value = ''
        }
    }

    // ... (other handlers remain same)

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">{t('products.title')}</h1>
                    {selectedProducts.length > 0 && (
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                            <span className="text-sm font-medium">{selectedProducts.length} selected</span>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={bulkActionLoading}>
                                {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete
                            </Button>

                            <Dialog open={isBulkCategoryOpen} onOpenChange={setIsBulkCategoryOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Set Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update Category for {selectedProducts.length} products</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Label>Select Category</Label>
                                        <Select onValueChange={(val) => handleBulkCategoryUpdate(val === "none" ? undefined : val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose category..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Category</SelectItem>
                                                {categories.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={exporting}>
                        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export XLSX
                    </Button>

                    <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Import XLSX
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Import Products from Excel</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Please upload an .xlsx file with the following columns:
                                </p>
                                <ul className="list-disc list-inside text-sm font-mono bg-muted p-2 rounded">
                                    <li>Name (Required)</li>
                                    <li>Price (Required, Number)</li>
                                    <li>Description (Optional)</li>
                                    <li>Category (Optional, Name)</li>
                                    <li>ImageURL (Optional, URL)</li>
                                </ul>
                                <div className="space-y-2">
                                    <Label>Select File</Label>
                                    <div className="relative">
                                        <Button variant="secondary" className="w-full relative cursor-pointer" disabled={importing}>
                                            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            {importing ? "Importing..." : "Choose File"}
                                        </Button>
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleImport}
                                            disabled={importing}
                                        />
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Quick Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Quick Add Products</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                                {quickAddRows.map((row, i) => (
                                    <div key={i} className="flex gap-2 items-end">
                                        <div className="flex-grow">
                                            <Label>Name</Label>
                                            <Input
                                                value={row.name}
                                                onChange={(e) => handleQuickAddChange(i, 'name', e.target.value)}
                                                placeholder="Product Name"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Label>Price</Label>
                                            <Input
                                                type="number"
                                                value={row.price}
                                                onChange={(e) => handleQuickAddChange(i, 'price', e.target.value)}
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeQuickRow(i)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" onClick={addQuickRow} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Add Row
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleQuickAddSubmit} disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save All
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={startCreate} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('products.add')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={selectedProducts.length === products.length && products.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="w-[80px]">{t('products.image')}</TableHead>
                                <TableHead>{t('products.name')}</TableHead>
                                <TableHead>{t('products.category')}</TableHead>
                                <TableHead>{t('products.price')}</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                        {t('products.empty')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((prod) => (
                                    <TableRow key={prod.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedProducts.includes(prod.id)}
                                                onCheckedChange={() => toggleSelect(prod.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {prod.images?.[0] || prod.imageUrl ? (
                                                <img
                                                    src={prod.images?.[0] || prod.imageUrl || ""}
                                                    alt={prod.name}
                                                    className="w-10 h-10 object-cover rounded-md"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md flex items-center justify-center">
                                                    <ImageIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{prod.name}</TableCell>
                                        <TableCell>{prod.category?.name || "-"}</TableCell>
                                        <TableCell>
                                            {Number(prod.price).toFixed(2)} {currency}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(prod)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('products.deleteTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription>{t('products.deleteDesc')}</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('products.cancel')}</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600" onClick={() => handleDelete(prod.id)}>
                                                                {t('products.confirm')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? t('products.edit') : t('products.add')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex gap-4">
                            {/* Image Upload Area */}
                            <div className="flex-shrink-0">
                                <Label className="mb-2 block">{t('products.image')}</Label>
                                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-2 w-32 h-32 flex flex-col items-center justify-center relative hover:bg-zinc-50 dark:hover:bg-zinc-900 transition cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                    ) : imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        <>
                                            <ImagePlus className="h-8 w-8 text-zinc-400 mb-2" />
                                            <span className="text-xs text-center text-zinc-500">{t('products.uploadImage')}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-grow space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name">{t('products.name')}</Label>
                                    <Input id="name" {...form.register("name")} />
                                    {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="price">{t('products.price')} ({currency})</Label>
                                        <Input id="price" type="number" step="0.01" {...form.register("price")} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="category">{t('products.category')}</Label>
                                        {form.watch() && (
                                            <div className="flex gap-2">
                                                <Select
                                                    onValueChange={(val) => {
                                                        if (val === "new") {
                                                            // Logic handled by dialog or additional input
                                                        } else {
                                                            form.setValue("categoryId", val)
                                                        }
                                                    }}
                                                    value={form.watch("categoryId") || "none"}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Category</SelectItem>
                                                        {categories.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button type="button" variant="outline" size="icon" title="Create New Category">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Create New Category</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="space-y-2">
                                                                <Label>Category Name</Label>
                                                                <Input id="new-category-name" placeholder="e.g. Summer Collection" />
                                                            </div>
                                                            <Button type="button" onClick={async () => {
                                                                const input = document.getElementById('new-category-name') as HTMLInputElement
                                                                if (!input.value) return

                                                                const token = localStorage.getItem('token')
                                                                const res = await fetch('/api/categories', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${token}`
                                                                    },
                                                                    body: JSON.stringify({ name: input.value })
                                                                })

                                                                if (res.ok) {
                                                                    const newCat = await res.json()
                                                                    // Refresh categories
                                                                    const catRes = await fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } })
                                                                    if (catRes.ok) {
                                                                        setCategories(await catRes.json())
                                                                    }
                                                                    form.setValue("categoryId", newCat.id)
                                                                    // Close dialog programmatically if we controlled it, but for now this is a nested dialog which might be tricky.
                                                                    // A better UX would be a separate state for this creating mode.
                                                                    // Let's rely on user clicking close or we can trigger a click on close button? 
                                                                    // Actually nested dialogs can be messy. Let's use a Popover or just a simple state toggle in the main form.
                                                                }
                                                            }}>Create</Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">{t('products.description')}</Label>
                            <Textarea id="description" {...form.register("description")} />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={saving || uploading}>
                                {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('products.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
