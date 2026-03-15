import { ScrollView, Text, StyleSheet } from 'react-native';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Help</Text>

      <Text style={styles.sectionTitle}>Explore Spots</Text>
      <Text style={styles.body}>
        Pan and zoom the map to discover wind and water sports spots near you.
        Use the time slider to see who's planning to go and when.
      </Text>

      <Text style={styles.sectionTitle}>Map Markers</Text>
      <Text style={styles.body}>
        Marker colors reflect how recently conditions were reported — green means
        fresh data, yellow is a few hours old, and grey means no recent reports.
        Numbers on markers show how many active sessions are at that spot.
      </Text>

      <Text style={styles.sectionTitle}>Spot Details</Text>
      <Text style={styles.body}>
        Tap any spot on the map to open its detail sheet. You'll see three
        sections: Sessions (who's there or planning to go), Conditions (latest
        wave and wind reports), and the About wiki (community-written info about
        the spot).
      </Text>

      <Text style={styles.sectionTitle}>Plan a Session</Text>
      <Text style={styles.body}>
        Tap "I'm Going" on a spot to start a session. Choose "Now" if you're
        already there, or pick a future time. Select your sport type (wing foil,
        windsurf, kite, or other) and submit. Sessions expire 90 minutes after
        the start time. Other users will see your session on the map and in the
        spot details.
      </Text>

      <Text style={styles.sectionTitle}>Report Conditions</Text>
      <Text style={styles.body}>
        If the latest report looks right, tap "Still Accurate" to confirm it.
        To submit a new report, tap "Conditions Changed," set the wave height
        with the slider, and drag the wind compass to set direction and speed.
        You can also add an optional note (up to 150 characters) for extra
        context like "glassy" or "choppy near the point."
      </Text>

      <Text style={styles.sectionTitle}>Community Wiki</Text>
      <Text style={styles.body}>
        Each spot has an About section that anyone can edit. Share useful info
        like parking directions, local hazards, ideal conditions, and etiquette
        tips. Tap "Edit" to contribute — your changes help the whole community.
      </Text>

      <Text style={styles.sectionTitle}>Your Account</Text>
      <Text style={styles.body}>
        Sign up to participate — you only need a username and password. Email is
        optional and used only for password recovery — it is never visible to
        other users. Manage your profile and
        preferences in Settings. You can delete your account at any time.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 24,
  },
});
