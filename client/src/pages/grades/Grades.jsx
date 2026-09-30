import BackLink from "../../components/design/BackLink.jsx";
import PageHeading from "../../components/design/PageHeading.jsx";
import { useEffect, useRef, useState } from "react";

import {
    getGrades,
    createGrade,
    updateGrade,
} from "../../services/grades.js";

import { getLocale } from "../../locales/locale.js";
import "../../styles/grades.css";

const PAGE_SIZE = 20;

const emptyForm = () => ({
    subject: "",
    title: "",
    score: "",
    assessedOn: "",
    notes: "",
});

function Grades() {
    const locale = getLocale();
    const text = locale.grades;

    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [grades, setGrades] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [saved, setSaved] = useState(false);

    const pendingRequest = useRef(null);
    const savingRef = useRef(false);
    const subjectInputRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            setLoading(true);
            setLoadError("");
            setGrades([]);
            setHasMore(false);

            try {
                const result = await getGrades({
                    offset: page * PAGE_SIZE,
                    limit: PAGE_SIZE,
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setGrades(result.grades);
                setHasMore(result.pagination.hasMore);
            } catch (error) {
                if (controller.signal.aborted) return;

                setLoadError(
                    error.response?.status === 401
                        ? "unauthorized"
                        : "load",
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => controller.abort();
    }, [page, reloadKey]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSaved(false);
        setSaveError("");
    };

    const handleEdit = (grade) => {
        if (savingRef.current) return;

        setEditingId(grade.id);

        setForm({
            subject: grade.subject,
            title: grade.title,
            score: String(grade.score),
            assessedOn: grade.assessedOn,
            notes: grade.notes ?? "",
        });

        pendingRequest.current = null;

        setSaveError("");
        setSaved(false);

        subjectInputRef.current?.focus();
    };

    const handleCancelEdit = () => {
        if (savingRef.current) return;

        setEditingId(null);
        setForm(emptyForm());

        pendingRequest.current = null;

        setSaveError("");
        setSaved(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (savingRef.current) return;

        const payload = {
            subject: form.subject.trim(),
            title: form.title.trim(),
            score: Number(form.score),
            assessedOn: form.assessedOn,
            notes: form.notes.trim(),
        };

        if (
            !payload.subject ||
            !payload.title ||
            !payload.assessedOn ||
            String(form.score).trim() === "" ||
            !Number.isFinite(payload.score) ||
            payload.score < 0 ||
            payload.score > 100 ||
            Math.abs(
                payload.score * 100 -
                Math.round(payload.score * 100),
            ) >= 1e-8
        ) {
            setSaveError("validation");
            setSaved(false);
            return;
        }

        payload.score = Math.round(payload.score * 100) / 100;

        const signature = JSON.stringify(payload);

        // Reuse the request ID when retrying the same new grade.
        if (
            !editingId &&
            pendingRequest.current?.signature !== signature
        ) {
            pendingRequest.current = {
                signature,
                requestId: crypto.randomUUID(),
            };
        }

        savingRef.current = true;
        setSaving(true);
        setSaveError("");
        setSaved(false);

        try {
            if (editingId) {
                await updateGrade(editingId, payload);
            } else {
                await createGrade({
                    ...payload,
                    requestId: pendingRequest.current.requestId,
                });
            }

            pendingRequest.current = null;

            setEditingId(null);
            setForm(emptyForm());
            setSaved(true);
            setPage(0);
            setReloadKey((value) => value + 1);
        } catch (error) {
            const status = error.response?.status;

            const errorKeys = {
                400: "validation",
                401: "unauthorized",
                404: "notFound",
                409: "conflict",
            };

            setSaveError(errorKeys[status] || "save");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    return (
        <main className="grades-page">
            <header>
                <BackLink>{locale.all.backHome}</BackLink>
                <PageHeading icon="grades" tone="yellow" title={text.title} description={text.description} />
            </header>

            <section
                className="grades-panel"
                aria-labelledby="grade-form-title"
            >
                <h2 id="grade-form-title">
                    {editingId ? text.editTitle : text.addTitle}
                </h2>

                <form onSubmit={handleSubmit} aria-busy={saving}>
                    <fieldset disabled={saving}>
                        <div className="grades-form-grid">
                            <label>
                                {text.subject}
                                <input
                                    ref={subjectInputRef}
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    maxLength={80}
                                    required
                                />
                            </label>

                            <label>
                                {text.assessmentTitle}
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    maxLength={120}
                                    required
                                />
                            </label>

                            <label>
                                {text.score}
                                <input
                                    name="score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={form.score}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                {text.assessedOn}
                                <input
                                    name="assessedOn"
                                    type="date"
                                    value={form.assessedOn}
                                    onChange={handleChange}
                                    required
                                />
                            </label>
                        </div>

                        <label>
                            {text.notes}
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                maxLength={500}
                                rows={3}
                            />
                        </label>

                        <div className="grades-form-actions">
                            <button type="submit">
                                {saving
                                    ? text.saving
                                    : editingId
                                      ? text.saveChanges
                                      : text.save}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                >
                                    {text.cancel}
                                </button>
                            )}
                        </div>
                    </fieldset>
                </form>

                {saveError && (
                    <p className="grades-error" role="alert">
                        {text.errors[saveError]}
                    </p>
                )}

                {saved && (
                    <p className="grades-success" role="status">
                        {text.saved}
                    </p>
                )}
            </section>

            <section
                className="grades-panel"
                aria-busy={loading}
                aria-labelledby="grades-list-title"
            >
                <h2 id="grades-list-title">{text.listTitle}</h2>

                {loading ? (
                    <p role="status">{locale.all.loading}</p>
                ) : loadError ? (
                    <div>
                        <p className="grades-error" role="alert">
                            {text.errors[loadError]}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setReloadKey((value) => value + 1)
                            }
                        >
                            {locale.all.retry}
                        </button>
                    </div>
                ) : grades.length === 0 ? (
                    <p>{text.empty}</p>
                ) : (
                    <div className="grades-list">
                        {grades.map((grade) => (
                            <article
                                className="grade-card"
                                key={grade.id}
                            >
                                <div className="grade-card-heading">
                                    <div>
                                        <h3>{grade.subject}</h3>
                                        <p>{grade.title}</p>
                                    </div>

                                    <strong>
                                        <bdi dir="ltr">
                                            {grade.score} / 100
                                        </bdi>
                                    </strong>
                                </div>

                                <time dateTime={grade.assessedOn}>
                                    <bdi>{grade.assessedOn}</bdi>
                                </time>

                                {grade.notes && <p>{grade.notes}</p>}

                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleEdit(grade)}
                                    aria-label={`${text.edit}: ${grade.subject} — ${grade.title}`}
                                >
                                    {text.edit}
                                </button>
                            </article>
                        ))}
                    </div>
                )}

                <nav
                    className="grades-pagination"
                    aria-label={text.listTitle}
                >
                    <button
                        type="button"
                        disabled={loading || page === 0}
                        onClick={() => setPage((value) => value - 1)}
                    >
                        {text.previous}
                    </button>

                    <span>
                        {text.page} {page + 1}
                    </span>

                    <button
                        type="button"
                        disabled={
                            loading ||
                            Boolean(loadError) ||
                            !hasMore
                        }
                        onClick={() => setPage((value) => value + 1)}
                    >
                        {text.next}
                    </button>
                </nav>
            </section>
        </main>
    );
}

export default Grades;