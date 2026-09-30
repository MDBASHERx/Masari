function TutorMentorSelector({ mode, onChangeMode, disabled = false }) {
  return (
    <div className="mode-selector">
      
<button
  className={mode === "tutor" ? "mode-button active" : "mode-button"}
  onClick={() => onChangeMode("tutor")}
  disabled={disabled}
>
  Tutor
</button>

<button
  className={mode === "mentor" ? "mode-button active" : "mode-button"}
  onClick={() => onChangeMode("mentor")}
  disabled={disabled}
>
  Mentor
  
</button>
      <p>
        الوضع الحالي: {mode}
      </p>
    </div>
  );
}

export default TutorMentorSelector;
