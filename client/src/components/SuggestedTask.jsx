function SuggestedTask({ task, onAdd, status = "idle", error = "" }) {
  if (!task) {
    return null;
  }

  return (
    <div className="suggested-task">

      <h3>
        مهمة مقترحة
      </h3>

      <p>
        {task.title}
      </p>

      <p>
        {task.minutes} دقائق
      </p>

      <button onClick={() => onAdd(task)} disabled={status === "loading" || status === "success"}>
        {status === "loading" ? "جارٍ الإضافة..." : status === "success" ? "تمت الإضافة" : "أضف إلى خطتي"}
      </button>
      {error && <p role="alert">{error}</p>}

    </div>
  );
}

export default SuggestedTask;
