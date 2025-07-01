import React, { useState } from "react";

const questions = [
  "On a scale of 1 to 5, how satisfied were you with the overall organization of the Ultimate Suite Games 2025? Feel free to elaborate.",
  "Which activity or game did you find most enjoyable?",
  "On a scale of 1 to 5, how would you rate the variety of games and gimmicks of the ultimate suite games?",
  "What aspects of the Ultimate Suite Games could be improved for future events?",
  "Do you have any suggestions for activities that we may include for the future ultimate suite games?",
  "How likely are you to attend the next Ultimate Suite Games?",
  "Any additional comments or suggestions for improving the ultimate suite games?",
];

const PulseSurvey = () => {
  const [surveyAnswers, setSurveyAnswers] = useState(Array(7).fill(""));

  const handleSurveyChange = (idx, value) => {
    setSurveyAnswers((prev) => {
      const updated = [...prev];
      updated[idx] = value;
      return updated;
    });
  };

  const handleSurveyClear = () => setSurveyAnswers(Array(7).fill(""));

  const handleSurveySubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your feedback!");
    handleSurveyClear();
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Anonymous Pulse Survey</h1>
      <p className="text-gray-600 mb-8">
        Thank you for taking part of our anonymous survey! Your feedback is crucial in helping us understand your notions and opinions about the company, whether positively or negatively. Your honest responses will guide us in providing better support for everyone. Let's get started!
      </p>
      <form onSubmit={handleSurveySubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx}>
            <label className="block font-medium text-gray-700 mb-1">{idx + 1}. {q}</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={surveyAnswers[idx]}
              onChange={e => handleSurveyChange(idx, e.target.value)}
              placeholder="Type here..."
            />
          </div>
        ))}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400"
            onClick={handleSurveyClear}
          >
            Clear Answers
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default PulseSurvey;