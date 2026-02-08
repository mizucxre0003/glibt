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
import { Checkbox } from "@/components/ui/checkbox"
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
import { Pencil, Trash2, Plus, Loader2, ScrollText } from "lucide-react"

const categorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    productIds: z.array(z.string()).optional()
})

export default function CategoriesPage() {
    const { t } = useLanguage()
    const [categories, setCategories] = useState<any[]>([])
    const [allProducts, setAllProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [saving, setSaving] = useState(false)

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", productIds: [] }
    })

    const fetchData = async () => {
        const token = localStorage.getItem('token')
        try {
            const [catRes, prodRes] = await Promise.all([
                fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/products', { headers: { 'Authorization': `Bearer ${token}` } })
            ])

            if (catRes.ok) setCategories(await catRes.json())
            if (prodRes.ok) setAllProducts(await prodRes.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const onSubmit = async (values: z.infer<typeof categorySchema>) => {
        setSaving(true)
        const token = localStorage.getItem('token')
        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories'

            const method = editingCategory ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values)
            })

            if (res.ok) {
                setIsDialogOpen(false)
                fetchData()
                form.reset()
                setEditingCategory(null)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (category: any) => {
        setEditingCategory(category)
        form.reset({
            name: category.name,
            productIds: category.products?.map((p: any) => p.id) || []
        })
        setIsDialogOpen(true)
    }

    const startCreate = () => {
        setEditingCategory(null)
        form.reset({ name: "", productIds: [] })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                fetchData()
            }
        } catch (e) {
            console.error(e)
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('categories.title')}</h1>
                <Button onClick={startCreate} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('categories.add')}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('categories.name')}</TableHead>
                                <TableHead>{t('categories.count')}</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                                        {t('categories.empty')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>{cat._count?.products || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}>
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
                                                            <AlertDialogTitle>{t('categories.deleteTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t('categories.deleteDesc')}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('categories.cancel')}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => handleDelete(cat.id)}
                                                            >
                                                                {t('categories.confirm')}
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
                        <DialogTitle>{editingCategory ? t('categories.edit') : t('categories.add')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('categories.name')}</Label>
                            <Input id="name" {...form.register("name")} />
                            {form.formState.errors.name && (
                                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label>Assigned Products</Label>
                            <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                                {allProducts.length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-4">No products available</div>
                                ) : (
                                    allProducts.map((prod) => (
                                        <div key={prod.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`prod-${prod.id}`}
                                                checked={(form.watch('productIds') || []).includes(prod.id)}
                                                onCheckedChange={(checked) => {
                                                    const current = form.getValues('productIds') || []
                                                    if (checked) {
                                                        form.setValue('productIds', [...current, prod.id])
                                                    } else {
                                                        form.setValue('productIds', current.filter(id => id !== prod.id))
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`prod-${prod.id}`} className="text-sm font-normal cursor-pointer">
                                                {prod.name}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Select products to assign to this category.</p>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('categories.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
