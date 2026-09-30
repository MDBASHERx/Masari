import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getProfile, updateProfile } from "../../services/profile.js";
import { getLocale } from "../../locales/locale.js";
import "../../styles/profile.css";

function Profile() {
  const locale = getLocale();

  const [form, setForm] = useState({
    full_name: "",
    grade_level: "",
    goal: "",
    daily_minutes: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const profile = await getProfile(controller.signal);

        if (controller.signal.aborted) return;

        setForm({
          full_name: profile.full_name,
          grade_level: profile.grade_level === null ? "" : String(profile.grade_level),
          goal: profile.goal,
          daily_minutes: profile.daily_minutes,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error.response?.status === 401) {
          setLoadError("sessionExpired");
        } else if (error.response?.status === 404) {
          setLoadError("notFound");
        } else {
          setLoadError("loadFailed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, [reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setLoadError("");
    setReloadKey((value) => value + 1);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
    setSaveError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const dailyMinutes = Number(form.daily_minutes);

    if (
      !form.full_name.trim() ||
      !Number.isInteger(dailyMinutes) ||
      dailyMinutes < 5 ||
      dailyMinutes > 240
    ) {
      setSaveError("invalidData");
      return;
    }

    setSaving(true);
    setSaved(false);
    setSaveError("");

    try {
      const profile = await updateProfile({
        full_name: form.full_name.trim(),
        grade_level: form.grade_level === "" ? null : Number(form.grade_level),
        goal: form.goal.trim(),
        daily_minutes: dailyMinutes,
      });

      setForm({
        full_name: profile.full_name,
        grade_level: profile.grade_level,
        goal: profile.goal,
        daily_minutes: profile.daily_minutes,
      });

      setSaved(true);
    } catch (error) {
      if (error.response?.status === 400) {
        setSaveError("invalidData");
      } else if (error.response?.status === 401) {
        setSaveError("sessionExpired");
      } else if (error.response?.status === 404) {
        setSaveError("notFound");
      } else {
        setSaveError("saveFailed");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profile-page">
      <section className="profile-card" aria-labelledby="profile-title">
        <Link to="/">{locale.profile.backHome}</Link>

        <h1 id="profile-title">{locale.profile.title}</h1>
        <p className="profile-description">
          {locale.profile.description}
        </p>

        {loading ? (
          <p role="status">{locale.profile.loading}</p>
        ) : loadError ? (
          <div className="profile-feedback">
            <p className="profile-error" role="alert">
              {locale.profile[loadError]}
            </p>

            <button
              className="profile-button"
              type="button"
              onClick={handleRetry}
            >
              {locale.profile.retry}
            </button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label htmlFor="full_name">
                {locale.profile.fullName}
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                dir="auto"
                autoComplete="name"
                maxLength={100}
                value={form.full_name}
                onChange={handleChange}
                disabled={saving}
                required
              />
            </div>

<div className="profile-field">
  <label htmlFor="grade_level">
    {locale.profile.gradeLevel}
  </label>

<select
  id="grade_level"
  name="grade_level"
  value={form.grade_level}
  onChange={handleChange}
  disabled={saving}
>
  <option value="">{locale.profile.selectGrade}</option>

  {Array.from({ length: 12 }, (_, index) => index + 1).map(
    (grade) => (
      <option key={grade} value={grade}>
        {locale.grades[grade]}
      </option>
    ),
  )}
</select>
</div>

            <div className="profile-field">
              <label htmlFor="goal">{locale.profile.goal}</label>

              <textarea
                id="goal"
                name="goal"
                dir="auto"
                rows={4}
                maxLength={500}
                value={form.goal}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="daily_minutes">
                {locale.profile.dailyMinutes}
              </label>

              <input
                id="daily_minutes"
                name="daily_minutes"
                type="number"
                min={5}
                max={240}
                step={1}
                aria-describedby="minutes-hint"
                value={form.daily_minutes}
                onChange={handleChange}
                disabled={saving}
                required
              />

              <small id="minutes-hint">
                {locale.profile.minutesHint}
              </small>
            </div>

            {saveError && (
              <p className="profile-error" role="alert">
                {locale.profile[saveError]}
              </p>
            )}

            {saved && (
              <p className="profile-success" role="status">
                {locale.profile.saved}
              </p>
            )}

            <button
              className="profile-button"
              type="submit"
              disabled={saving}
            >
              {saving ? locale.profile.saving : locale.profile.save}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default Profile;