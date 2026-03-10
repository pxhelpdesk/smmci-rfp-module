// components/rfp/rfp-signatories-form.tsx
import { X, GripVertical } from 'lucide-react';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserOption } from '@/types';
import { useEffect, useRef, useState } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type SignatoriesState = {
    recommending_approval_by: (UserOption | null)[];
    approved_by: (UserOption | null)[];
    concurred_by: (UserOption | null)[];
};

type Entry = {
    id: string;
    user: UserOption | null;
    isLocked: boolean;
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

// ─── Sortable Row ────────────────────────────────────────────────────────────

function SortableRow({
    entry,
    userOptions,
    selectStyles,
    onUpdate,
    onRemove,
    allowRemove = false,
}: {
    entry: Entry;
    userOptions: UserOption[];
    selectStyles: any;
    onUpdate: (opt: UserOption | null) => void;
    onRemove: () => void;
    allowRemove?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex gap-1 items-center">
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1 shrink-0"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1">
                <Select
                    options={userOptions}
                    value={entry.user ?? null}
                    onChange={onUpdate}
                    placeholder="Select user..."
                    isClearable={!entry.isLocked}
                    isDisabled={entry.isLocked}
                    className="text-sm"
                    styles={selectStyles}
                />
            </div>

            {(!entry.isLocked || allowRemove) ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-destructive hover:text-destructive h-9 w-9 p-0 shrink-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            ) : (
                <div className="w-9 shrink-0" />
            )}
        </div>
    );
}

// ─── Sortable List ───────────────────────────────────────────────────────────

function SortableList({
    entries,
    userOptions,
    selectStyles,
    onDragEnd,
    onUpdate,
    onRemove,
    allowRemove = false,
}: {
    entries: Entry[];
    userOptions: UserOption[];
    selectStyles: any;
    onDragEnd: (event: DragEndEvent) => void;
    onUpdate: (id: string, opt: UserOption | null) => void;
    onRemove: (id: string) => void;
    allowRemove?: boolean;
}) {
    const sensors = useSensors(useSensor(PointerSensor));

    if (entries.length === 0) {
        return <Input placeholder="None" className="h-9" readOnly disabled />;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
                {entries.map(entry => (
                    <SortableRow
                        key={entry.id}
                        entry={entry}
                        userOptions={userOptions}
                        selectStyles={selectStyles}
                        onUpdate={(opt) => onUpdate(entry.id, opt)}
                        onRemove={() => onRemove(entry.id)}
                        allowRemove={allowRemove}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function RfpSignatoriesForm({
    preparedByName,
    signatories,
    userOptions,
    onChange,
    office,
    subtotalAmount,
    residentManager,
    departmentHead,
    cfo,
    ceo,
}: Props) {

    // ── Recommending Approval By entries ──────────────────────────
    const [recommendingEntries, setRecommendingEntries] = useState<Entry[]>(() =>
        signatories.recommending_approval_by.map((u, i) => ({
            id: `rec-${i}-${Date.now()}`,
            user: u,
            isLocked: false,
        }))
    );

    // ── Approved By entries ───────────────────────────────────────
    const [approvedEntries, setApprovedEntries] = useState<Entry[]>(() =>
        signatories.approved_by.map((u, i) => ({
            id: `app-${i}-${Date.now()}`,
            user: u,
            isLocked: isDefaultApprovedId(u?.value),
        }))
    );

    // ── Concurred By entries ──────────────────────────────────────
    const [concurredEntries, setConcurredEntries] = useState<Entry[]>(() =>
        signatories.concurred_by.map((u, i) => ({
            id: `con-${i}-${Date.now()}`,
            user: u,
            isLocked: true,
        }))
    );

    function isDefaultApprovedId(id?: number): boolean {
        if (!id) return false;
        return [residentManager?.id, departmentHead?.id, cfo?.id, ceo?.id]
            .filter(Boolean)
            .includes(id);
    }

    const computeDefaultApproved = (): Entry[] => {
        const defaults: Entry[] = [];

        if (office === 'mine_site' && residentManager) {
            defaults.push({
                id: `default-rm-${Date.now()}`,
                user: { value: residentManager.id, label: residentManager.name, department: residentManager.department },
                isLocked: true,
            });
        }

        if (departmentHead) {
            if (office === 'head_office' || (office === 'mine_site' && subtotalAmount >= 500000)) {
                defaults.push({
                    id: `default-dh-${Date.now()}`,
                    user: { value: departmentHead.id, label: departmentHead.name, department: departmentHead.department },
                    isLocked: true,
                });
            }
        }

        if (subtotalAmount >= 1000000 && cfo) {
            defaults.push({
                id: `default-cfo-${Date.now()}`,
                user: { value: cfo.id, label: cfo.name, department: cfo.department },
                isLocked: true,
            });
        }

        if (subtotalAmount >= 5000000 && ceo) {
            defaults.push({
                id: `default-ceo-${Date.now()}`,
                user: { value: ceo.id, label: ceo.name, department: ceo.department },
                isLocked: true,
            });
        }

        return defaults;
    };

    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        // Preserve extras, recompute locked defaults
        const extras = approvedEntries.filter(e => !e.isLocked);
        const defaults = computeDefaultApproved();
        const newEntries = [...extras, ...defaults];
        setApprovedEntries(newEntries);
        onChange({ ...signatories, approved_by: newEntries.map(e => e.user) });
    }, [office, subtotalAmount]);

    // ── Sync helpers ──────────────────────────────────────────────

    const syncRecommending = (entries: Entry[]) => {
        setRecommendingEntries(entries);
        onChange({ ...signatories, recommending_approval_by: entries.map(e => e.user) });
    };

    const syncApproved = (entries: Entry[]) => {
        setApprovedEntries(entries);
        onChange({ ...signatories, approved_by: entries.map(e => e.user) });
    };

    const syncConcurred = (entries: Entry[]) => {
        setConcurredEntries(entries);
        onChange({ ...signatories, concurred_by: entries.map(e => e.user) });
    };

    // ── Add ───────────────────────────────────────────────────────

    const addRecommending = () => {
        syncRecommending([...recommendingEntries, { id: `rec-${Date.now()}`, user: null, isLocked: false }]);
    };

    const addApproved = () => {
        const newEntry: Entry = { id: `app-extra-${Date.now()}`, user: null, isLocked: false };
        syncApproved([newEntry, ...approvedEntries]);
    };

    // ── Remove ────────────────────────────────────────────────────

    const removeRecommending = (id: string) => syncRecommending(recommendingEntries.filter(e => e.id !== id));
    const removeApproved = (id: string) => syncApproved(approvedEntries.filter(e => e.id !== id));

    // ── Update ────────────────────────────────────────────────────

    const updateRecommending = (id: string, opt: UserOption | null) =>
        syncRecommending(recommendingEntries.map(e => e.id === id ? { ...e, user: opt } : e));

    const updateApproved = (id: string, opt: UserOption | null) =>
        syncApproved(approvedEntries.map(e => e.id === id ? { ...e, user: opt } : e));

    // ── Drag End ──────────────────────────────────────────────────

    const handleDragEndRecommending = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = recommendingEntries.findIndex(e => e.id === active.id);
        const newIndex = recommendingEntries.findIndex(e => e.id === over.id);
        syncRecommending(arrayMove(recommendingEntries, oldIndex, newIndex));
    };

    const handleDragEndApproved = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = approvedEntries.findIndex(e => e.id === active.id);
        const newIndex = approvedEntries.findIndex(e => e.id === over.id);
        syncApproved(arrayMove(approvedEntries, oldIndex, newIndex));
    };

    const handleDragEndConcurred = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = concurredEntries.findIndex(e => e.id === active.id);
        const newIndex = concurredEntries.findIndex(e => e.id === over.id);
        syncConcurred(arrayMove(concurredEntries, oldIndex, newIndex));
    };

    // ─────────────────────────────────────────────────────────────

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
                                onClick={addRecommending}>
                                + Add
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Approved By</p>
                            <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1"
                                onClick={addApproved}>
                                + Add
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Concurred By</p>
                            {/* <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1"
                                onClick={addConcurred}>
                                + Add
                            </Button> */}
                        </div>
                    </div>
                </div>

                {/* Signatory Inputs */}
                <div className="flex gap-2 items-start px-3">
                    <div className="flex-1 grid grid-cols-4 gap-4">

                        {/* Prepared By */}
                        <div>
                            <Input value={preparedByName} className="h-9 bg-muted" readOnly />
                        </div>

                        {/* Recommending Approval By */}
                        <div className="space-y-1.5">
                            <SortableList
                                entries={recommendingEntries}
                                userOptions={userOptions}
                                selectStyles={selectStyles}
                                onDragEnd={handleDragEndRecommending}
                                onUpdate={updateRecommending}
                                onRemove={removeRecommending}
                            />
                        </div>

                        {/* Approved By */}
                        <div className="space-y-1.5">
                            <SortableList
                                entries={approvedEntries}
                                userOptions={userOptions}
                                selectStyles={selectStyles}
                                onDragEnd={handleDragEndApproved}
                                onUpdate={updateApproved}
                                onRemove={removeApproved}
                            />
                        </div>

                        {/* Concurred By */}
                        <div className="space-y-1.5">
                            <SortableList
                                entries={concurredEntries}
                                userOptions={userOptions}
                                selectStyles={selectStyles}
                                onDragEnd={handleDragEndConcurred}
                                onUpdate={() => {}}
                                onRemove={(id) => syncConcurred(concurredEntries.filter(e => e.id !== id))}
                                allowRemove={true}
                            />
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
