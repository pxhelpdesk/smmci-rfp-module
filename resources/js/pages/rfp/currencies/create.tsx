import { useForm, Head } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/rfp/currencies');
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Currencies', href: '/rfp/currencies' },
                { title: 'Create', href: '/rfp/currencies/create' },
            ]}
        >
            <Head title="Create Currency" />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Create Currency</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Add a new currency
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                            <a href="/rfp/currencies">
                                <X className="h-4 w-4 mr-1.5" />
                                Cancel
                            </a>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="h-4 w-4 mr-1.5" />
                            Save
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Currency Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code *</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., USD"
                                    maxLength={3}
                                />
                                {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., US Dollar"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                placeholder="Optional description"
                            />
                            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
}
