function SuggestedTask({ task, onAdd }) {
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

      <button onClick={() => onAdd(task)}>
        أضف إلى خطتي
      </button>

    </div>
  );
}

export default SuggestedTask;