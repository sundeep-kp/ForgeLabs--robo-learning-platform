// src/content-data.js

export const roboticsRoadmaps = {
  "robotic-arm": {
    title: "🦾 Industrial Automated Robotic Arm",
    description: "Beginner to advanced course covering mechanics, Arduino, ROS2, and Dynamixel motor control.",
    chapters: [

      // -------------------------
      // MODULE 1 — FOUNDATIONS
      // -------------------------
      {
        title: "MODULE 1 — Foundations",
        subchapters: [
          { id: "m1s1-intro", title: "1.1 What is an Industrial Robotic Arm?", contentFile: "m1s1-intro.html" },
          { id: "m1s2-tools", title: "1.2 Tools & Components", contentFile: "m1s2-tools.html" },
          { id: "m1s3-roadmap", title: "1.3 Course Roadmap", contentFile: "m1s3-roadmap.html" },
          { id: "m1s4-playground", title: "1.4 How to Use the Playground", contentFile: "m1s4-playground.html" },
        ]
      },

      // -------------------------
      // MODULE 2 — ARDUINO BASICS
      // -------------------------
      {
        title: "MODULE 2 — Arduino Basics",
        subchapters: [
          {
            id: "m2s1-led",
            title: "2.1 LED Control (I/O)",
            contentFile: "m2s1-led.html",
            debugging: [
              "LED too dim → check resistor (>150Ω).",
              "No light → reverse polarity (long leg = positive)."
            ],
            failure: ["Overcurrent → frying LED.", "Wrong polarity → usually no damage."],
            playground: "/playground.html?component=arduino-uno",
            resources: [
              { name: "Arduino: Digital I/O", url: "https://www.arduino.cc/reference/en/language/functions/digital-io/digitalwrite/" },
              { name: "Ohm’s Law Calculator", url: "https://ohmslawcalculator.com/" }
            ]
          },

          {
            id: "m2s2-servo",
            title: "2.2 Servo Control (PWM)",
            contentFile: "m2s2-servo.html",
            debugging: [
              "Servo jitter → insufficient power or missing GND.",
              "No movement → wrong PWM pin or missing signal."
            ],
            failure: [
              "Stall → overheating and high current draw.",
              "Wrong voltage → internal controller damage.",
              "Overload → stripped gears."
            ],
            playground: "/playground.html?component=servo-motor",
            resources: [
              { name: "Arduino Servo Library", url: "https://www.arduino.cc/reference/en/libraries/servo/" },
              { name: "PWM Explained (SparkFun)", url: "https://learn.sparkfun.com/tutorials/pulse-width-modulation/all" }
            ]
          },

          {
            id: "m2s3-lcd",
            title: "2.3 LCD Screen (I2C)",
            contentFile: "m2s3-lcd.html",
            debugging: [
              "Blank screen → adjust contrast knob.",
              "Address error → try 0x27, 0x3F, or 0x20."
            ],
            failure: ["No backlight → check VCC/GND."],
            playground: "/playground.html?component=arduino-uno",
            resources: [
              { name: "LiquidCrystal I2C Library", url: "https://github.com/johnrickman/LiquidCrystal_I2C" },
              { name: "I2C Protocol Overview", url: "https://www.i2c-bus.org/" }
            ]
          },

          { id: "m2s4-joint1", title: "2.4 Build Joint 1 (1‑DOF)", contentFile: "m2s4-joint1.html" },

          {
            id: "m2s5-multi",
            title: "2.5 Multi‑Servo Control (2–4 DOF)",
            contentFile: "m2s5-multi.html",
            debugging: ["High current draw → use external PSU.", "Laggy code → replace delay() with millis()."],
            playground: "/playground.html?component=servo-motor",
            resources: [
              { name: "Arduino: millis()", url: "https://www.arduino.cc/en/Tutorial/BuiltInExamples/BlinkWithoutDelay" },
              { name: "Powering Servos Safely", url: "https://learn.adafruit.com/servo-motors/powering" }
            ]
          }
        ]
      },

      // -------------------------
      // MODULE 3 — KINEMATICS
      // -------------------------
      {
        title: "MODULE 3 — Mechanics & Kinematics",
        subchapters: [
          { id: "m3s1-torque", title: "3.1 Link Lengths & Torque", contentFile: "m3s1-torque.html" },
          { id: "m3s2-forward", title: "3.2 Forward Kinematics", contentFile: "m3s2-forward.html" },
          { id: "m3s3-inverse", title: "3.3 Inverse Kinematics", contentFile: "m3s3-inverse.html" },
          { id: "m3s4-build2dof", title: "3.4 Build a 2‑DOF Arm Frame", contentFile: "m3s4-build2dof.html" },
        ]
      },

      // -------------------------
      // MODULE 4 — ROS2 & RViz
      // -------------------------
      {
        title: "MODULE 4 — ROS2 & RViz",
        subchapters: [
          { id: "m4s0-ros2fundamentals", title: "4.0 ROS2 Fundamentals", contentFile: "m4s0-ros2fundamentals.html" },
          { id: "m4s1-install", title: "4.1 Install ROS2", contentFile: "m4s1-install.html" },
          { id: "m4s2-rviz", title: "4.2 RViz Visualization", contentFile: "m4s2-rviz.html" },
          { id: "m4s3-publish", title: "4.3 Publish Joint States", contentFile: "m4s3-publish.html" },
          { id: "m4s4-control", title: "4.4 ROS2 Control Node", contentFile: "m4s4-control.html" }
        ]
      },

      // -------------------------
      // MODULE 5 — ADVANCED CONTROL
      // -------------------------
      {
        title: "MODULE 5 — Advanced Control",
        subchapters: [
          { id: "m5s1-pid", title: "5.1 PID Control", contentFile: "m5s1-pid.html", playground: "/playground.html?component=capacitor" },
          { id: "m5s2-trajectory", title: "5.2 Trajectory Generation", contentFile: "m5s2-trajectory.html" },
          { id: "m5s3-sensors", title: "5.3 Sensors & Monitoring", contentFile: "m5s3-sensors.html", playground: "/playground.html?component=ultrasonic-sensor" }
        ]
      },

      // -------------------------
      // MODULE 6 — DYNAMIXEL
      // -------------------------
      {
        title: "MODULE 6 — Dynamixel Ecosystem",
        subchapters: [
          { id: "m6s1-u2d2", title: "6.1 U2D2 Interface", contentFile: "m6s1-u2d2.html" },
          { id: "m6s2-opencr", title: "6.2 OpenCR Controller", contentFile: "m6s2-opencr.html" },
          { id: "m6s3-overview", title: "6.3 OpenManipulator‑X Overview", contentFile: "m6s3-overview.html" },
          { id: "m6s4-dxlmodes", title: "6.4 Dynamixel Operating Modes", contentFile: "m6s4-dxlmodes.html" }
        ]
      },

      // -------------------------
      // MODULE 7 — SYSTEM INTEGRATION
      // -------------------------
      {
        title: "MODULE 7 — Full Integration",
        subchapters: [
          { id: "m7s1-urdf", title: "7.1 URDF + RViz Motion", contentFile: "m7s1-urdf.html" },
          { id: "m7s2-ros2control", title: "7.2 ROS2 + Dynamixel Control", contentFile: "m7s2-ros2control.html" },
          { id: "m7s3-logic", title: "7.3 Industrial Automation Logic", contentFile: "m7s3-logic.html" }
        ]
      },

      // -------------------------
      // MODULE 8 — FINAL PROJECT
      // -------------------------
      {
        title: "MODULE 8 — Final Project",
        subchapters: [
          { id: "m8s1-build", title: "8.1 Build & Test", contentFile: "m8s1-build.html" },
          { id: "m8s2-docs", title: "8.2 Documentation", contentFile: "m8s2-docs.html" },
          { id: "m8s3-export", title: "8.3 Portfolio Export", contentFile: "m8s3-export.html" }
        ]
      },

      // -------------------------
      // BONUS — ELECTRONICS SAFETY
      // -------------------------
      {
        title: "BONUS — Electronics Safety",
        subchapters: [
          {
            id: "electronics-safety",
            title: "Electronics Safety & Failure Prevention",
            contentFile: "electronics-safety.html",
            resources: [
              { name: "Adafruit Safety Guides", url: "https://learn.adafruit.com/category/safety" },
              { name: "SparkFun Power Safety", url: "https://learn.sparkfun.com" },
              { name: "DigiKey Education", url: "https://www.digikey.com/en/resources/education" }
            ]
          }
        ]
      }
    ]
  }
};
