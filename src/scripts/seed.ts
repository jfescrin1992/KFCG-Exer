
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "bustling-airship-hv7sv",
  appId: "1:761519873849:web:f84e658e0f1cd8eac5d2e8",
  apiKey: "AIzaSyBNe2VABBfa2mLiI-bx8Ni4ChD2tJzDnTY",
  authDomain: "bustling-airship-hv7sv.firebaseapp.com",
  storageBucket: "bustling-airship-hv7sv.firebasestorage.app",
  messagingSenderId: "761519873849"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-kfcgexerfit-5e552e02-3201-4286-ac83-8063dee3ccb9");

const mockStudents = [
  { id: "S1001", name: "Marcus Rodriguez" },
  { id: "S1002", name: "Sarah Jenkins" },
  { id: "S1003", name: "Liam Chen" },
  { id: "S1004", name: "Aisha Taylor" },
  { id: "S1005", name: "Elena Volkov" },
  { id: "S1006", name: "Jordan Smith" }
];

const components = [
  { id: 'pushups', name: 'Push-ups' },
  { id: 'situps', name: 'Sit-ups' },
  { id: 'plank', name: 'Plank' },
  { id: 'jumping-jacks', name: 'Jumping Jacks' }
];

async function seed() {
  console.log("Starting database seed process...");
  
  try {
    for (const student of mockStudents) {
      console.log(`Processing student: ${student.name}`);
      const numTests = 2 + Math.floor(Math.random() * 2);
      const selectedComponents = [...components].sort(() => 0.5 - Math.random()).slice(0, numTests);
      
      for (const comp of selectedComponents) {
        const score = 65 + Math.floor(Math.random() * 30);
        const valid = 15 + Math.floor(Math.random() * 25);
        const invalid = Math.floor(Math.random() * 5);
        
        console.log(`Attempting to add assessment for ${student.name}: ${comp.name}`);
        const docRef = await addDoc(collection(db, 'assessments'), {
          studentId: student.id,
          studentName: student.name,
          componentId: comp.id,
          rawResult: `${valid} reps`,
          score: score,
          validReps: valid,
          invalidReps: invalid,
          timestamp: serverTimestamp()
        });
        console.log(`Successfully added doc with ID: ${docRef.id}`);
      }
    }
    console.log("Seed process completed successfully!");
  } catch (e) {
    console.error("Critical error during seeding:", e);
    process.exit(1);
  }
  
  console.log("Exiting script.");
  process.exit(0);
}

seed();
