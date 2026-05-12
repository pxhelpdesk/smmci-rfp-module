// components/rfp/rfp-signatories-form.tsx
import { X, GripVertical, RotateCcw } from 'lucide-react';
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
    philex_user_name?: string;
    isLocked: boolean;
};

type Props = {
    preparedByName: string;
    signatories: SignatoriesState;
    userOptions: UserOption[];
    onChange: (signatories: SignatoriesState) => void;
    onEntriesChange?: (entries: {
        recommending: Entry[];
        approved: Entry[];
        concurred: Entry[];
    }) => void;
    office: 'head_office' | 'mine_site';
    subtotalAmount: number;
    residentManager?: { id: number; name: string; department?: string } | null;
    departmentHead?: { id: number; name: string; department?: string } | null;
    cfo?: { id: number; name: string; department?: string } | null;
    ceo?: { id: number; name: string; department?: string } | null;
};

function getRecommendingDuplicateIds(
    recommending: Entry[],
    approved: Entry[],
    concurred: Entry[],
    preparedByUserId?: number,
): Set<number> {
    const higherIds = new Set<number>([
        ...(preparedByUserId ? [preparedByUserId] : []),
        ...approved.map(e => e.user?.value).filter((v): v is number => v !== undefined),
        ...concurred.map(e => e.user?.value).filter((v): v is number => v !== undefined),
    ]);
    const flagged = new Set<number>();
    recommending.forEach(e => {
        if (e.user?.value && higherIds.has(e.user.value)) flagged.add(e.user.value);
    });
    return flagged;
}

function getApprovedDuplicateIds(
    approved: Entry[],
    concurred: Entry[],
): Set<number> {
    const higherIds = new Set<number>(
        concurred.map(e => e.user?.value).filter((v): v is number => v !== undefined)
    );
    const flagged = new Set<number>();
    approved.forEach(e => {
        if (e.user?.value && higherIds.has(e.user.value)) flagged.add(e.user.value);
    });
    return flagged;
}

function SortableRow({
    entry,
    userOptions,
    selectStyles,
    onUpdate,
    onUpdatePhilexName,
    onRemove,
    allowRemove = false,
    sublabel,
    isDuplicate = false,
}: {
    entry: Entry;
    userOptions: UserOption[];
    selectStyles: any;
    onUpdate: (opt: UserOption | null) => void;
    onUpdatePhilexName: (name: string) => void;
    onRemove: () => void;
    allowRemove?: boolean;
    sublabel?: string;
    isDuplicate?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col gap-0.5">
            <div className="flex gap-1 items-center">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1 shrink-0"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex-1 space-y-1">
                    <Select
                        options={userOptions}
                        value={entry.user ?? null}
                        onChange={onUpdate}
                        placeholder="Select user..."
                        isClearable={!entry.isLocked}
                        isDisabled={entry.isLocked}
                        className="text-sm"
                        styles={{
                            ...selectStyles,
                            control: (base: any) => ({
                                ...selectStyles.control(base),
                                borderColor: isDuplicate ? 'rgb(234 179 8)' : base.borderColor,
                            }),
                        }}
                    />
                    {/* Manual name input — only shown when no user selected and not locked */}
                    {!entry.user && !entry.isLocked && (
                        <Input
                            value={entry.philex_user_name ?? ''}
                            onChange={(e) => onUpdatePhilexName(e.target.value)}
                            placeholder="Manual for Philex Manager..."
                            className="h-8 text-sm"
                        />
                    )}
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

            <div className="pl-7 flex items-center gap-1.5">
                {sublabel && (
                    <span className="text-[10px] text-muted-foreground">{sublabel}</span>
                )}
                {isDuplicate && (
                    <span className="text-[10px] text-yellow-600 font-medium">
                        Duplicate — will be removed on save
                    </span>
                )}
            </div>
        </div>
    );
}

function SortableList({
    entries,
    userOptions,
    selectStyles,
    onDragEnd,
    onUpdate,
    onUpdatePhilexName,
    onRemove,
    allowRemove = false,
    getSublabel,
    duplicateIds,
}: {
    entries: Entry[];
    userOptions: UserOption[];
    selectStyles: any;
    onDragEnd: (event: DragEndEvent) => void;
    onUpdate: (id: string, opt: UserOption | null) => void;
    onUpdatePhilexName: (id: string, name: string) => void;
    onRemove: (id: string) => void;
    allowRemove?: boolean;
    getSublabel?: (entry: Entry, index: number) => string | undefined;
    duplicateIds?: Set<number>;
}) {
    const sensors = useSensors(useSensor(PointerSensor));

    if (entries.length === 0) {
        return <Input placeholder="None" className="h-9" readOnly disabled />;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
                {entries.map((entry, index) => (
                    <SortableRow
                        key={entry.id}
                        entry={entry}
                        userOptions={userOptions}
                        selectStyles={selectStyles}
                        onUpdate={(opt) => onUpdate(entry.id, opt)}
                        onUpdatePhilexName={(name) => onUpdatePhilexName(entry.id, name)}
                        onRemove={() => onRemove(entry.id)}
                        allowRemove={allowRemove}
                        sublabel={getSublabel?.(entry, index)}
                        isDuplicate={!!(entry.user?.value && duplicateIds?.has(entry.user.value))}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}

export function dedupeSignatories(state: SignatoriesState): SignatoriesState {
    const deduped_concurred = state.concurred_by.filter(Boolean) as UserOption[];
    const concurredIds = new Set(deduped_concurred.map(u => u.value));

    const deduped_approved = state.approved_by.filter(u => {
        if (!u) return false;
        return !concurredIds.has(u.value);
    }) as UserOption[];
    const approvedIds = new Set(deduped_approved.map(u => u.value));

    const deduped_recommending = state.recommending_approval_by.filter(u => {
        if (!u) return false;
        return !approvedIds.has(u.value) && !concurredIds.has(u.value);
    }) as UserOption[];

    return {
        recommending_approval_by: deduped_recommending,
        approved_by: deduped_approved,
        concurred_by: deduped_concurred,
    };
}

export function RfpSignatoriesForm({
    preparedByName,
    signatories,
    userOptions,
    onChange,
    onEntriesChange,
    office,
    subtotalAmount,
    residentManager,
    departmentHead,
    cfo,
    ceo,
}: Props) {

    const defaultRecommendingEntries = useRef<Entry[]>(
        signatories.recommending_approval_by.map((u, i) => ({
            id: `rec-${i}-${Date.now()}`,
            user: u,
            philex_user_name: '',
            isLocked: false,
        }))
    );

    const defaultConcurredEntries = useRef<Entry[]>(
        signatories.concurred_by.map((u, i) => ({
            id: `con-${i}-${Date.now()}`,
            user: u,
            philex_user_name: '',
            isLocked: true,
        }))
    );

    const [recommendingEntries, setRecommendingEntries] = useState<Entry[]>(() =>
        defaultRecommendingEntries.current
    );

    const [approvedEntries, setApprovedEntries] = useState<Entry[]>(() =>
        signatories.approved_by.map((u, i) => ({
            id: `app-${i}-${Date.now()}`,
            user: u,
            philex_user_name: '',
            isLocked: isDefaultApprovedId(u?.value),
        }))
    );

    const [concurredEntries, setConcurredEntries] = useState<Entry[]>(() =>
        defaultConcurredEntries.current
    );

    const defaultApprovedEntries = useRef<Entry[]>([]);

    function isDefaultApprovedId(id?: number): boolean {
        if (!id) return false;
        return [residentManager?.id, departmentHead?.id, cfo?.id, ceo?.id]
            .filter(Boolean)
            .includes(id);
    }

    const computeDefaultApproved = (): Entry[] => {
        const defaults: Entry[] = [];
        const addedIds = new Set<number>();

        const pushIfNew = (id: number, entry: Omit<Entry, 'id'> & { id: string }) => {
            if (addedIds.has(id)) return;
            addedIds.add(id);
            defaults.push(entry);
        };

        if (office === 'mine_site' && residentManager) {
            pushIfNew(residentManager.id, {
                id: `default-rm-${Date.now()}`,
                user: { value: residentManager.id, label: residentManager.name, department: residentManager.department },
                philex_user_name: '',
                isLocked: true,
            });
        }

        if (departmentHead) {
            if (office === 'head_office' || (office === 'mine_site' && subtotalAmount >= 500000)) {
                pushIfNew(departmentHead.id, {
                    id: `default-dh-${Date.now()}`,
                    user: { value: departmentHead.id, label: departmentHead.name, department: departmentHead.department },
                    philex_user_name: '',
                    isLocked: true,
                });
            }
        }

        if (subtotalAmount >= 1000000 && cfo) {
            pushIfNew(cfo.id, {
                id: `default-cfo-${Date.now()}`,
                user: { value: cfo.id, label: cfo.name, department: cfo.department },
                philex_user_name: '',
                isLocked: true,
            });
        }

        if (subtotalAmount >= 5000000 && ceo) {
            pushIfNew(ceo.id, {
                id: `default-ceo-${Date.now()}`,
                user: { value: ceo.id, label: ceo.name, department: ceo.department },
                philex_user_name: '',
                isLocked: true,
            });
        }

        return defaults;
    };

    const isMounted = useRef(false);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            defaultApprovedEntries.current = approvedEntries.filter(e => e.isLocked);
            return;
        }

        const defaults = computeDefaultApproved();
        defaultApprovedEntries.current = defaults;

        const defaultIds = new Set(defaults.map(e => e.user?.value).filter(Boolean));
        const extras = approvedEntries.filter(
            e => !e.isLocked && e.user?.value && !defaultIds.has(e.user.value)
        );

        const newEntries = [...extras, ...defaults];
        setApprovedEntries(newEntries);
        handleChange({ ...signatories, approved_by: newEntries.map(e => e.user) }, newEntries, recommendingEntries, concurredEntries);
    }, [office, subtotalAmount]);

    const handleChange = (
        newState: SignatoriesState,
        approved = approvedEntries,
        recommending = recommendingEntries,
        concurred = concurredEntries,
    ) => {
        onChange(dedupeSignatories(newState));
        onEntriesChange?.({ recommending, approved, concurred });
    };

    const syncRecommending = (entries: Entry[]) => {
        setRecommendingEntries(entries);
        handleChange({ ...signatories, recommending_approval_by: entries.map(e => e.user) }, approvedEntries, entries, concurredEntries);
    };

    const syncApproved = (entries: Entry[]) => {
        setApprovedEntries(entries);
        handleChange({ ...signatories, approved_by: entries.map(e => e.user) }, entries, recommendingEntries, concurredEntries);
    };

    const syncConcurred = (entries: Entry[]) => {
        setConcurredEntries(entries);
        handleChange({ ...signatories, concurred_by: entries.map(e => e.user) }, approvedEntries, recommendingEntries, entries);
    };

    // ── Reset handlers ────────────────────────────────────────────

    const resetRecommending = () => {
        const restored = defaultRecommendingEntries.current.map(e => ({
            ...e,
            id: `rec-reset-${e.user?.value}-${Date.now()}`,
        }));
        syncRecommending(restored);
    };

    const resetApproved = () => {
        const defaults = computeDefaultApproved();
        const restored = defaults.map(e => ({
            ...e,
            id: `app-reset-${e.user?.value}-${Date.now()}`,
        }));
        syncApproved(restored);
    };

    const resetConcurred = () => {
        const restored = defaultConcurredEntries.current.map(e => ({
            ...e,
            id: `con-reset-${e.user?.value}-${Date.now()}`,
        }));
        syncConcurred(restored);
    };

    // ── Modified detection ────────────────────────────────────────

    const defaultRecommendingIds = defaultRecommendingEntries.current
        .map(e => e.user?.value).filter(Boolean).sort().join(',');
    const currentRecommendingIds = recommendingEntries
        .map(e => e.user?.value).filter(Boolean).sort().join(',');
    const recommendingIsModified = defaultRecommendingIds !== currentRecommendingIds;

    const defaultApprovedIds = computeDefaultApproved()
        .map(e => e.user?.value).filter(Boolean).sort().join(',');
    const currentApprovedIds = approvedEntries
        .filter(e => e.isLocked)
        .map(e => e.user?.value).filter(Boolean).sort().join(',');
    const approvedIsModified = defaultApprovedIds !== currentApprovedIds;

    const defaultConcurredIds = defaultConcurredEntries.current
        .map(e => e.user?.value).filter(Boolean).sort().join(',');
    const currentConcurredIds = concurredEntries
        .map(e => e.user?.value).filter(Boolean).sort().join(',');
    const concurredIsModified = defaultConcurredIds !== currentConcurredIds;

    // ── Add ───────────────────────────────────────────────────────

    const addRecommending = () => {
        syncRecommending([...recommendingEntries, { id: `rec-${Date.now()}`, user: null, philex_user_name: '', isLocked: false }]);
    };

    const addApproved = () => {
        const newEntry: Entry = { id: `app-extra-${Date.now()}`, user: null, philex_user_name: '', isLocked: false };
        syncApproved([newEntry, ...approvedEntries]);
    };

    // ── Remove ────────────────────────────────────────────────────

    const removeRecommending = (id: string) =>
        syncRecommending(recommendingEntries.filter(e => e.id !== id));

    const removeApproved = (id: string) => {
        const entry = approvedEntries.find(e => e.id === id);
        if (entry?.isLocked) return;
        syncApproved(approvedEntries.filter(e => e.id !== id));
    };

    // ── Update user ───────────────────────────────────────────────

    const updateRecommending = (id: string, opt: UserOption | null) =>
        syncRecommending(recommendingEntries.map(e => e.id === id ? { ...e, user: opt, philex_user_name: opt ? '' : e.philex_user_name } : e));

    const updateApproved = (id: string, opt: UserOption | null) =>
        syncApproved(approvedEntries.map(e => e.id === id ? { ...e, user: opt, philex_user_name: opt ? '' : e.philex_user_name } : e));

    // ── Update philex_user_name ───────────────────────────────────

    const updateRecommendingPhilexName = (id: string, name: string) =>
        syncRecommending(recommendingEntries.map(e => e.id === id ? { ...e, philex_user_name: name } : e));

    const updateApprovedPhilexName = (id: string, name: string) =>
        syncApproved(approvedEntries.map(e => e.id === id ? { ...e, philex_user_name: name } : e));

    const updateConcurredPhilexName = (id: string, name: string) =>
        syncConcurred(concurredEntries.map(e => e.id === id ? { ...e, philex_user_name: name } : e));

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

    const selectStyles = {
        control: (base: any) => ({ ...base, minHeight: '36px', fontSize: '14px' }),
        menu: (base: any) => ({ ...base, fontSize: '14px' }),
    };

    const preparedByUserId = userOptions.find(u => u.label === preparedByName)?.value;

    const recommendingDuplicateIds = getRecommendingDuplicateIds(
        recommendingEntries, approvedEntries, concurredEntries, preparedByUserId,
    );
    const approvedDuplicateIds = getApprovedDuplicateIds(approvedEntries, concurredEntries);

    const getRecommendingSublabel = (_entry: Entry, index: number) =>
        index === 0 ? 'Scope Owner' : 'Additional';

    const getApprovedSublabel = (entry: Entry, _index: number): string => {
        if (!entry.isLocked) return 'Additional';
        if (entry.user?.value === ceo?.id && subtotalAmount >= 5000000) return 'President & CEO (>5M – 50M)';
        if (entry.user?.value === cfo?.id && subtotalAmount >= 1000000) return 'Treasurer & CFO (>1M – 5M)';
        if (entry.user?.value === departmentHead?.id) {
            if (office === 'mine_site' && subtotalAmount >= 500000 && subtotalAmount < 1000000)
                return 'Department Highest Manager (>500k – 1M)';
            return 'Department Highest Manager (1 – 1M)';
        }
        if (entry.user?.value === residentManager?.id) return 'Resident Manager (1 – 500k)';
        return '';
    };

    const getConcurredSublabel = () => 'Finance Concurrence';

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Signatories</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 px-3 pb-2">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                        <p className="text-xs font-medium text-muted-foreground">Prepared By</p>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Recommending Approval By</p>
                            <div className="flex items-center gap-1">
                                {recommendingIsModified && defaultRecommendingEntries.current.length > 0 && (
                                    <Button type="button" variant="outline" size="sm"
                                        className="h-5 text-xs px-1 text-muted-foreground"
                                        onClick={resetRecommending} title="Restore default recommending signatories">
                                        <RotateCcw className="h-3 w-3 mr-1" />Reset
                                    </Button>
                                )}
                                <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1" onClick={addRecommending}>
                                    + Add
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Approved By</p>
                            <div className="flex items-center gap-1">
                                {approvedIsModified && (
                                    <Button type="button" variant="outline" size="sm"
                                        className="h-5 text-xs px-1 text-muted-foreground"
                                        onClick={resetApproved} title="Restore default approved signatories">
                                        <RotateCcw className="h-3 w-3 mr-1" />Reset
                                    </Button>
                                )}
                                <Button type="button" variant="outline" size="sm" className="h-5 text-xs px-1" onClick={addApproved}>
                                    + Add
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Concurred By</p>
                            {concurredIsModified && defaultConcurredEntries.current.length > 0 && (
                                <Button type="button" variant="outline" size="sm"
                                    className="h-5 text-xs px-1 text-muted-foreground"
                                    onClick={resetConcurred} title="Restore default concurred signatories">
                                    <RotateCcw className="h-3 w-3 mr-1" />Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 items-start px-3">
                    <div className="flex-1 grid grid-cols-4 gap-4">

                        <div className="space-y-0.5">
                            <Input value={preparedByName} className="h-9 bg-muted" readOnly />
                            <p className="text-[10px] text-muted-foreground pl-1">Requestor</p>
                        </div>

                        <div className="space-y-1.5">
                            <SortableList
                                entries={recommendingEntries}
                                userOptions={userOptions}
                                selectStyles={selectStyles}
                                onDragEnd={handleDragEndRecommending}
                                onUpdate={updateRecommending}
                                onUpdatePhilexName={updateRecommendingPhilexName}
                                onRemove={removeRecommending}
                                getSublabel={getRecommendingSublabel}
                                duplicateIds={recommendingDuplicateIds}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <SortableList
                                entries={approvedEntries}
                                userOptions={userOptions}
                                selectStyles={selectStyles}
                                onDragEnd={handleDragEndApproved}
                                onUpdate={updateApproved}
                                onUpdatePhilexName={updateApprovedPhilexName}
                                onRemove={removeApproved}
                                getSublabel={getApprovedSublabel}
                                duplicateIds={approvedDuplicateIds}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <SortableList
                                entries={concurredEntries}
                                userOptions={userOptions}
                                selectStyles={selectStyles}
                                onDragEnd={handleDragEndConcurred}
                                onUpdate={() => {}}
                                onUpdatePhilexName={updateConcurredPhilexName}
                                onRemove={(id) => syncConcurred(concurredEntries.filter(e => e.id !== id))}
                                allowRemove={true}
                                getSublabel={getConcurredSublabel}
                                duplicateIds={new Set()}
                            />
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
