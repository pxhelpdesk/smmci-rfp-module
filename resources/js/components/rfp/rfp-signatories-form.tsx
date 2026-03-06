import { X } from 'lucide-react';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserOption } from '@/types';

export type SignatoriesState = {
    recommending_approval_by: (UserOption | null)[];
    approved_by: (UserOption | null)[];
    concurred_by: (UserOption | null)[];
};

type Props = {
    preparedByName: string;
    signatories: SignatoriesState;
    userOptions: UserOption[];
    onChange: (signatories: SignatoriesState) => void;
};

export function RfpSignatoriesForm({ preparedByName, signatories, userOptions, onChange }: Props) {
    const addSignatory = (role: keyof SignatoriesState) => {
        onChange({ ...signatories, [role]: [...signatories[role], null] });
    };

    const removeSignatory = (role: keyof SignatoriesState, index: number) => {
        onChange({ ...signatories, [role]: signatories[role].filter((_, i) => i !== index) });
    };

    const updateSignatory = (role: keyof SignatoriesState, index: number, opt: UserOption | null) => {
        const updated = [...signatories[role]];
        updated[index] = opt;
        onChange({ ...signatories, [role]: updated });
    };

    const selectStyles = {
        control: (base: any) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
        menu: (base: any) => ({ ...base, fontSize: '14px' }),
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Signatories</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Column Headers */}
                <div className="flex gap-2 px-3 pb-2">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                        <p className="text-xs font-medium text-muted-foreground">Prepared By</p>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Recommending Approval By</p>
                            <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1"
                                onClick={() => addSignatory('recommending_approval_by')}>
                                + Add
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Approved By</p>
                            <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1"
                                onClick={() => addSignatory('approved_by')}>
                                + Add
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Concurred By</p>
                            {/* <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1"
                                onClick={() => addSignatory('concurred_by')}>
                                + Add
                            </Button> */}
                        </div>
                    </div>
                </div>

                {/* Signatory Inputs */}
                <div className="flex gap-2 items-start px-3">
                    <div className="flex-1 grid grid-cols-4 gap-4">

                        {/* Prepared By — read only */}
                        <div>
                            <Input value={preparedByName} className="h-9 bg-muted" readOnly />
                        </div>

                        {/* Recommending Approval By */}
                        <div className="space-y-1.5">
                            {signatories.recommending_approval_by.length === 0 ? (
                                <Input placeholder="None" className="h-9" readOnly disabled />
                            ) : (
                                signatories.recommending_approval_by.map((opt, i) => (
                                    <div key={i} className="flex gap-1 items-center">
                                        <div className="flex-1">
                                            <Select
                                                options={userOptions}
                                                value={opt ?? null}
                                                onChange={(val) => updateSignatory('recommending_approval_by', i, val)}
                                                placeholder="Select user..."
                                                isClearable
                                                className="text-sm"
                                                styles={selectStyles}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" size="sm"
                                            onClick={() => removeSignatory('recommending_approval_by', i)}
                                            className="text-destructive hover:text-destructive h-9 w-9 p-0 shrink-0">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Approved By */}
                        <div className="space-y-1.5">
                            {signatories.approved_by.length === 0 ? (
                                <Input placeholder="None" className="h-9" readOnly disabled />
                            ) : (
                                signatories.approved_by.map((opt, i) => (
                                    <div key={i} className="flex gap-1 items-center">
                                        <div className="flex-1">
                                            <Select
                                                options={userOptions}
                                                value={opt ?? null}
                                                onChange={(val) => updateSignatory('approved_by', i, val)}
                                                placeholder="Select user..."
                                                isClearable
                                                className="text-sm"
                                                styles={selectStyles}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" size="sm"
                                            onClick={() => removeSignatory('approved_by', i)}
                                            className="text-destructive hover:text-destructive h-9 w-9 p-0 shrink-0">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Concurred By — disabled/read only */}
                        <div className="space-y-1.5">
                            {signatories.concurred_by.length === 0 ? (
                                <Input placeholder="None" className="h-9" readOnly disabled />
                            ) : (
                                signatories.concurred_by.map((opt, i) => (
                                    <div key={i} className="flex gap-1 items-center">
                                        <div className="flex-1">
                                            <Select
                                                options={userOptions}
                                                value={opt ?? null}
                                                onChange={(val) => updateSignatory('concurred_by', i, val)}
                                                placeholder="Select user..."
                                                isClearable
                                                isDisabled={true}
                                                className="text-sm"
                                                styles={selectStyles}
                                            />
                                        </div>
                                        {/* <Button type="button" variant="ghost" size="sm"
                                            onClick={() => removeSignatory('concurred_by', i)}
                                            className="text-destructive hover:text-destructive h-9 w-9 p-0 shrink-0">
                                            <X className="h-4 w-4" />
                                        </Button> */}
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
