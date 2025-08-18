import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Scheduled function that degrades creature stats every hour
 **/
export const degradeCreatureStats = functions.pubsub
  .schedule('0 * * * *') // Every hour at minute 0
  .timeZone('UTC')
  .onRun(async (context: functions.EventContext) => {
    const db = admin.firestore();
    const creaturesRef = db.collection('creatures');

    try {
      console.log('Starting creature stat degradation...');

      // Get all creatures
      const snapshot = await creaturesRef.get();

      if (snapshot.empty) {
        console.log('No creatures found to update');
        return null;
      }

      const batch = db.batch();
      let updateCount = 0;

      snapshot.docs.forEach((doc) => {
        const creature = doc.data();

        // Calculate new values with floor of 0 and ceiling of 100
        const currentHunger = creature.hunger || 100;
        const currentLove = creature.love || 100;
        const currentTiredness = creature.tiredness || 0;

        const newHunger = Math.max(0, Math.min(100, creature.hunger - 10));
        const newLove = Math.max(0, Math.min(100, creature.love - 10));
        const newTiredness = Math.max(0, Math.min(100, currentTiredness + 10));

        const updates = {
          hunger: newHunger,
          love: newLove,
          tiredness: newTiredness,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.update(doc.ref, updates);
        updateCount++;

        console.log(
          `Updating creature ${doc.id}: ` +
            `hunger ${currentHunger}→${newHunger}, ` +
            `love ${currentLove}→${newLove}, ` +
            `tiredness ${currentTiredness}→${newTiredness}`
        );
      });

      await batch.commit();
      console.log(
        `Successfully updated ${updateCount} creatures at ${new Date().toISOString()}`
      );

      return;
    } catch (error) {
      console.error('Error degrading creature stats:', error);
      throw error;
    }
  });

/**
 * Test function to manually trigger stat degradation
 * Requires Firebase Authentication - only authenticated users can call this
 */
export const testDegradeCreatureStats = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Verify Firebase Auth token
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res
          .status(401)
          .json({
            error: 'Unauthorized: Missing or invalid Authorization header',
          });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      console.log(
        `Test function called by user: ${decodedToken.email} (${decodedToken.uid})`
      );

      // Optional: Add additional authorization check for specific users
      // if (decodedToken.email !== 'vo.eric@gmail.com') {
      //   res.status(403).json({ error: 'Forbidden: Only specific users can access this function' });
      //   return;
      // }
    } catch (error) {
      console.error('Auth verification failed:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid Firebase token' });
      return;
    }

    try {
      // Call the same logic as the scheduled function
      const db = admin.firestore();
      const creaturesRef = db.collection('creatures');

      const snapshot = await creaturesRef.get();

      if (snapshot.empty) {
        res.json({ message: 'No creatures found to update', count: 0 });
        return;
      }

      const batch = db.batch();
      let updateCount = 0;
      const updates: any[] = [];

      snapshot.docs.forEach((doc) => {
        const creature = doc.data();

        const currentHunger = creature.hunger || 100;
        const currentLove = creature.love || 100;
        const currentTiredness = creature.tiredness || 0;

        const newHunger = Math.max(0, Math.min(100, currentHunger - 10));
        const newLove = Math.max(0, Math.min(100, currentLove - 10));
        const newTiredness = Math.max(0, Math.min(100, currentTiredness + 10));

        const updateData = {
          hunger: newHunger,
          love: newLove,
          tiredness: newTiredness,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.update(doc.ref, updateData);
        updateCount++;

        updates.push({
          id: doc.id,
          name: creature.name,
          before: {
            hunger: currentHunger,
            love: currentLove,
            tiredness: currentTiredness,
          },
          after: { hunger: newHunger, love: newLove, tiredness: newTiredness },
        });
      });

      await batch.commit();

      res.json({
        message: `Successfully updated ${updateCount} creatures`,
        count: updateCount,
        timestamp: new Date().toISOString(),
        updates: updates,
      });
    } catch (error) {
      console.error('Error in test function:', error);
      res.status(500).json({ error: 'Internal server error', details: error });
    }
  }
);
