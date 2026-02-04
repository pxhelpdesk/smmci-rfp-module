import { useForm, Head } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import Select from 'react-select';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RfpUsage, RfpCategory } from '@/types';

type Props = {
    usage: RfpUsage;
    categories: RfpCategory[];
};

export default function Edit({ usage, categories }: Props) {
    const { data, setData, put, processing, errors } = useForm<{
        rfp_category_id: number | null;
        code: string;
        description: string;
        is_active: boolean;
    }>({
        rfp_category_id: usage.rfp_category_id,
        code: usage.code,
        description: usage.description,
        is_active: usage.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/rfp/usages/${usage.id}`);
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: `${c.code} - ${c.name}`,
    }));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Usages', href: '/rfp/usages' },
                { title: usage.code, href: `/rfp/usages/${usage.id}/edit` },
            ]}
        >
            <Head title={`Edit ${usage.code}`} />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Edit Usage</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {usage.code}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                            <a href="/rfp/usages">
                                <X className="h-4 w-4 mr-1.5" />
                                Cancel
                            </a>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            <Save className="h-4 w-4 mr-1.5" />
                            Update
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select
                                options={categoryOptions}
                                value={categoryOptions.find(o => o.value === data.rfp_category_id)}
                                onChange={(opt) => setData('rfp_category_id', opt?.value || null)}
                                className="text-sm"
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '40px', fontSize: '14px' }),
                                    menu: (base) => ({ ...base, fontSize: '14px' }),
                                }}
                            />
                            {errors.rfp_category_id && <p className="text-xs text-destructive">{errors.rfp_category_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                            />
                            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
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
