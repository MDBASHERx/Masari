import createUserClient from "../utils/createUserClient.js";

const gradeFields =
    "id, subject, title, score, assessed_on, notes, request_id, created_at";

const formatGrade = (grade) => ({
    id: grade.id,
    subject: grade.subject,
    title: grade.title,
    score: Number(grade.score),
    assessedOn: grade.assessed_on,
    notes: grade.notes,
    requestId: grade.request_id,
    createdAt: grade.created_at,
});

export const listGrades = async (req, res) => {
    const supabase = createUserClient(req.accessToken);
    const { offset, limit } = req.validated.query;

    const { data, error } = await supabase
        .from("grades")
        .select(gradeFields)
        .eq("user_id", req.user.id)
        .order("assessed_on", { ascending: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + limit);

    if (error) {
        throw error;
    }

    return res.json({
        success: true,
        grades: data.slice(0, limit).map(formatGrade),
        pagination: {
            offset,
            limit,
            hasMore: data.length > limit,
        },
    });
};

export const createGrade = async (req, res) => {
    const supabase = createUserClient(req.accessToken);

    const {
        subject,
        title,
        score,
        assessedOn,
        notes,
        requestId,
    } = req.validated.body;

    const { data, error } = await supabase
        .from("grades")
        .insert({
            user_id: req.user.id,
            subject,
            title,
            score,
            assessed_on: assessedOn,
            notes,
            request_id: requestId,
        })
        .select(gradeFields)
        .single();

    if (error?.code === "23505") {
        const { data: existing, error: readError } = await supabase
            .from("grades")
            .select(gradeFields)
            .eq("user_id", req.user.id)
            .eq("request_id", requestId)
            .maybeSingle();

        if (readError) {
            throw readError;
        }

        if (!existing) {
            throw error;
        }

        const sameData =
            existing.subject === subject &&
            existing.title === title &&
            Number(existing.score) === score &&
            existing.assessed_on === assessedOn &&
            existing.notes === notes;

        if (!sameData) {
            return res.status(409).json({
                success: false,
                code: "REQUEST_ID_CONFLICT",
                message: "This requestId was used for a different grade",
            });
        }

        return res.status(200).json({
            success: true,
            created: false,
            grade: formatGrade(existing),
        });
    }

    if (error) {
        throw error;
    }

    return res.status(201).json({
        success: true,
        created: true,
        grade: formatGrade(data),
    });
};

export const updateGrade = async (req, res) => {
    const supabase = createUserClient(req.accessToken);
    const { id } = req.validated.params;

    const {
        subject,
        title,
        score,
        assessedOn,
        notes,
    } = req.validated.body;

    const { data, error } = await supabase
        .from("grades")
        .update({
            subject,
            title,
            score,
            assessed_on: assessedOn,
            notes,
        })
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select(gradeFields)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return res.status(404).json({
            success: false,
            code: "GRADE_NOT_FOUND",
            message: "Grade not found",
        });
    }

    return res.json({
        success: true,
        grade: formatGrade(data),
    });
};