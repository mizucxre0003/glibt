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
import { Pencil, Trash2, Plus, Loader2, ImagePlus, ImageIcon } from "lucide-react"

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    stock: z.coerce.number().int().min(0),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional(),
})

export default function ProductsPage() {
    const { t } = useLanguage()
    const [products, setProducts] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            stock: 0,
            categoryId: undefined,
            imageUrl: ""
        }
    })

    const fetchData = async () => {
        const token = localStorage.getItem('token')
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } })
            ])

            if (prodRes.ok) setProducts(await prodRes.json())
            if (catRes.ok) setCategories(await catRes.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                form.setValue('imageUrl', data.url)
            } else {
                console.error("Upload failed")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setUploading(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof productSchema>) => {
        setSaving(true)
        const token = localStorage.getItem('token')
        try {
            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : '/api/products'

            const method = editingProduct ? 'PUT' : 'POST'

            // Clean values
            const payload = {
                ...values,
                categoryId: values.categoryId === "none" ? null : values.categoryId || null
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setIsDialogOpen(false)
                fetchData()
                form.reset()
                setEditingProduct(null)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (product: any) => {
        setEditingProduct(product)
        form.reset({
            name: product.name,
            description: product.description || "",
            price: Number(product.price),
            stock: product.stock,
            categoryId: product.categoryId || undefined,
            imageUrl: product.images?.[0] || product.imageUrl || "" // Handle array or string if schema varies
        })
        setIsDialogOpen(true)
    }

    const startCreate = () => {
        setEditingProduct(null)
        form.reset({
            name: "",
            description: "",
            price: 0,
            stock: 0,
            categoryId: undefined,
            imageUrl: ""
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        const token = localStorage.getItem('token')
        try {
            await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            fetchData()
        } catch (e) { console.error(e) }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    const imageUrl = form.watch('imageUrl')

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('products.title')}</h1>
                <Button onClick={startCreate} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('products.add')}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">{t('products.image')}</TableHead>
                                <TableHead>{t('products.name')}</TableHead>
                                <TableHead>{t('products.category')}</TableHead>
                                <TableHead>{t('products.price')}</TableHead>
                                <TableHead>{t('products.stock')}</TableHead>
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
                                            {prod.images?.[0] || prod.imageUrl ? (
                                                <img
                                                    src={prod.images?.[0] || prod.imageUrl}
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
                                        <TableCell>{Number(prod.price).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={prod.stock === 0 ? "text-red-500" : ""}>
                                                {prod.stock}
                                            </span>
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
                                        <Label htmlFor="price">{t('products.price')}</Label>
                                        <Input id="price" type="number" step="0.01" {...form.register("price")} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="stock">{t('products.stock')}</Label>
                                        <Input id="stock" type="number" {...form.register("stock")} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="category">{t('products.category')}</Label>
                                    {form.watch() && ( // Re-render trick if needed, usually Controller is better but native Select works with fetch
                                        <Select
                                            onValueChange={(val) => form.setValue("categoryId", val)}
                                            value={form.watch("categoryId") || "none"}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Category</SelectItem>
                                                {categories.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
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
