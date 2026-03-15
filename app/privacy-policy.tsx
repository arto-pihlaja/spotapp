import { ScrollView, Text, View, StyleSheet } from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: March 15, 2026</Text>

      <Text style={styles.intro}>
        SpotApp is a community-driven wind and water sports app for tracking
        spots, logging sessions, and sharing conditions. We respect your privacy
        and collect only the minimum data needed to run the service.
      </Text>

      <Text style={styles.sectionTitle}>1. What We Collect</Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Account data:</Text> Username (a pseudonym
        — it does not need to be your real name) and password (stored securely
        using bcrypt hashing). Email is optional and only collected if you choose
        to provide it for password recovery. Your email is never shown to other
        users.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Activity data:</Text> Spots you create,
        sessions you log, condition reports you submit, and wiki edits you make.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Technical data:</Text> IP addresses recorded
        in server logs, retained for 30 days.
      </Text>

      <Text style={styles.sectionTitle}>2. Why We Collect It</Text>
      <Text style={styles.body}>
        We collect this data solely to provide the SpotApp service: spot
        tracking, session sharing, condition reporting, and the community wiki.
        We do not use your data for advertising, profiling, or any purpose
        unrelated to operating the app.
      </Text>

      <Text style={styles.sectionTitle}>3. Legal Basis</Text>
      <Text style={styles.body}>
        Under the General Data Protection Regulation (GDPR), our legal bases for
        processing your data are:
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Article 6(1)(b) — Contract performance:</Text>{' '}
        Processing your account and activity data is necessary to provide the
        service you signed up for.
      </Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Article 6(1)(f) — Legitimate interest:</Text>{' '}
        Server logs (including IP addresses) are processed for security,
        debugging, and abuse prevention.
      </Text>

      <Text style={styles.sectionTitle}>4. Data Hosting</Text>
      <Text style={styles.body}>
        All data is stored on servers located in the European Union. Your data
        does not leave the EU.
      </Text>

      <Text style={styles.sectionTitle}>5. Data Sharing</Text>
      <Text style={styles.body}>
        We do not share your data with any third parties. SpotApp has no
        analytics services, no advertising networks, and no external tracking.
        Your data stays with SpotApp.
      </Text>

      <Text style={styles.sectionTitle}>6. Your Rights</Text>
      <Text style={styles.body}>
        Under the GDPR, you have the right to:
      </Text>
      <View style={styles.list}>
        <Text style={styles.listItem}>
          {'\u2022'} <Text style={styles.bold}>Access</Text> — request a copy of the
          personal data we hold about you.
        </Text>
        <Text style={styles.listItem}>
          {'\u2022'} <Text style={styles.bold}>Rectification</Text> — correct any
          inaccurate data.
        </Text>
        <Text style={styles.listItem}>
          {'\u2022'} <Text style={styles.bold}>Erasure</Text> — delete your account and
          personal data (available directly in Settings).
        </Text>
        <Text style={styles.listItem}>
          {'\u2022'} <Text style={styles.bold}>Data portability</Text> — receive your
          data in a structured, machine-readable format.
        </Text>
        <Text style={styles.listItem}>
          {'\u2022'} <Text style={styles.bold}>Lodge a complaint</Text> — with your local
          data protection supervisory authority.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>7. Account Deletion</Text>
      <Text style={styles.body}>
        You can delete your account at any time from the Settings screen. When
        you delete your account, all personal data (username, email, sessions,
        condition reports) is permanently removed. Community wiki contributions
        you have made are anonymized so the community knowledge is preserved, but
        they are no longer linked to you.
      </Text>

      <Text style={styles.sectionTitle}>8. Data Retention</Text>
      <Text style={styles.body}>
        Account and activity data is kept for as long as your account exists.
        When you delete your account, this data is removed. Server logs
        containing IP addresses are automatically deleted after 30 days.
      </Text>

      <Text style={styles.sectionTitle}>9. Contact</Text>
      <Text style={styles.body}>
        For any privacy-related questions or to exercise your GDPR rights,
        contact us at:{'\n'}
        <Text style={styles.bold}>privacy@spotapp.org</Text>
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
    marginBottom: 4,
  },
  updated: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  intro: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600',
  },
  list: {
    marginBottom: 16,
  },
  listItem: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
});
