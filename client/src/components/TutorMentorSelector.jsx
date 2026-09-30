function TutorMentorSelector({ mode, onChangeMode }) {
  return (
    <div className="mode-selector">
      
<button
  className={mode === "tutor" ? "mode-button active" : "mode-button"}
  onClick={() => onChangeMode("tutor")}
>
  Tutor
</button>

<button
  className={mode === "mentor" ? "mode-button active" : "mode-button"}
  onClick={() => onChangeMode("mentor")}
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