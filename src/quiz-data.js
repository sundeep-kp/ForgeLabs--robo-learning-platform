// src/quiz-data.js

export const QUIZ_DATA = {
  "m1s1-intro": {
    passScore: 2,
    questions: [
      {
        question: "What are the core physical components of a robotic arm?",
        options: [
          "CPU and RAM",
          "Links, joints, actuators",
          "Sensors only",
          "Software and firmware"
        ],
        correctIndex: 1
      },
      {
        question: "What does a joint allow in a robotic system?",
        options: [
          "Power regulation",
          "Signal processing",
          "Relative motion between links",
          "Error correction"
        ],
        correctIndex: 2
      }
    ]
  },

  "m1s2-tools": {
    passScore: 1,
    questions: [
      {
        question: "Which tool is essential for diagnosing electrical faults?",
        options: [
          "Hot glue gun",
          "Multimeter",
          "Allen key",
          "Oscilloscope probe only"
        ],
        correctIndex: 1
      }
    ]
  }
};
