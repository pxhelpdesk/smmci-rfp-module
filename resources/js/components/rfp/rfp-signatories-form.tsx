import { X } from 'lucide-react';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserOption } from '@/types';
import { useEffect, useRef, useState } from 'react';

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
    office: 'head_office' | 'mine_site';
    subtotalAmount: number;
    residentManager?: { id: number; name: string; department?: string } | null;
    departmentHead?: { id: number; name: string; department?: string } | null;
    cfo?: { id: number; name: string; department?: string } | null;
    ceo?: { id: number; name: string; department?: string } | null;
};

export function RfpSignatoriesForm({ preparedByName, signatories, userOptions, onChange, office, subtotalAmount, residentManager, departmentHead, cfo, ceo }: Props) {
    const [extraApprovedBy, setExtraApprovedBy] = useState<(UserOption | null)[]>([]);

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

    const addExtraApprovedBy = () => {
        setExtraApprovedBy(prev => [...prev, null]);
    };

    const removeExtraApprovedBy = (index: number) => {
        const updated = extraApprovedBy.filter((_, i) => i !== index);
        setExtraApprovedBy(updated);
        // sync to parent
        const defaultApproved = signatories.approved_by.filter(u => isDefaultApprovedUser(u));
        onChange({ ...signatories, approved_by: [...updated, ...defaultApproved] });
    };

    const updateExtraApprovedBy = (index: number, opt: UserOption | null) => {
        const updated = [...extraApprovedBy];
        updated[index] = opt;
        setExtraApprovedBy(updated);
        // sync to parent: extra first, then defaults
        const defaultApproved = computeDefaultApproved();
        onChange({ ...signatories, approved_by: [...updated, ...defaultApproved] });
    };

    const isMounted = useRef(false);

    const computeDefaultApproved = (): (UserOption | null)[] => {
        const approvedBy: (UserOption | null)[] = [];

        if (office === 'mine_site' && residentManager) {
            approvedBy.push({ value: residentManager.id, label: residentManager.name, department: residentManager.department });
        }

        if (departmentHead) {
            if (office === 'head_office' || (office === 'mine_site' && subtotalAmount >= 500000)) {
                approvedBy.push({ value: departmentHead.id, label: departmentHead.name, department: departmentHead.department });
            }
        }

        if (subtotalAmount >= 1000000 && cfo) {
            approvedBy.push({ value: cfo.id, label: cfo.name, department: cfo.department });
        }

        if (subtotalAmount >= 5000000 && ceo) {
            approvedBy.push({ value: ceo.id, label: ceo.name, department: ceo.department });
        }

        return approvedBy;
    };

    const isDefaultApprovedUser = (u: UserOption | null): boolean => {
        if (!u) return false;
        const defaultIds = [residentManager?.id, departmentHead?.id, cfo?.id, ceo?.id].filter(Boolean);
        return defaultIds.includes(u.value);
    };

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const defaultApproved = computeDefaultApproved();
        onChange({ ...signatories, approved_by: [...extraApprovedBy, ...defaultApproved] });
    }, [office, subtotalAmount]);

    const defaultApprovedBy = signatories.approved_by.filter(u => isDefaultApprovedUser(u));

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
                                onClick={addExtraApprovedBy}>
                                + Add
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Concurred By</p>
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

                        {/* Approved By — extra (removable) first, then defaults (locked) */}
                        <div className="space-y-1.5">
                            {extraApprovedBy.length === 0 && defaultApprovedBy.length === 0 ? (
                                <Input placeholder="None" className="h-9" readOnly disabled />
                            ) : (
                                <>
                                    {/* Extra users — removable */}
                                    {extraApprovedBy.map((opt, i) => (
                                        <div key={`extra-${i}`} className="flex gap-1 items-center">
                                            <div className="flex-1">
                                                <Select
                                                    options={userOptions}
                                                    value={opt ?? null}
                                                    onChange={(val) => updateExtraApprovedBy(i, val)}
                                                    placeholder="Select user..."
                                                    isClearable
                                                    className="text-sm"
                                                    styles={selectStyles}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="sm"
                                                onClick={() => removeExtraApprovedBy(i)}
                                                className="text-destructive hover:text-destructive h-9 w-9 p-0 shrink-0">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {/* Default users — locked/read only */}
                                    {defaultApprovedBy.map((opt, i) => (
                                        <div key={`default-${i}`} className="flex gap-1 items-center">
                                            <div className="flex-1">
                                                <Select
                                                    options={userOptions}
                                                    value={opt ?? null}
                                                    onChange={() => {}}
                                                    placeholder="Select user..."
                                                    isDisabled={true}
                                                    className="text-sm"
                                                    styles={selectStyles}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </>
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
