import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';

const genderOptions = ['Male', 'Female', 'Other'] as const;
const bodyShapeOptions = ['Rectangle', 'Triangle', 'Hourglass', 'Oval'] as const;

type FormState = {
  age: string;
  bodyShape: string;
  country: string;
  firstName: string;
  gender: string;
  height: string;
  lastName: string;
  weight: string;
};

function validateProfile(form: FormState) {
  if (!form.firstName.trim()) {
    return 'First name is required';
  }
  if (!form.lastName.trim()) {
    return 'Last name is required';
  }
  if (!form.country.trim()) {
    return 'Country is required';
  }
  if (!form.age.trim()) {
    return 'Age is required';
  }
  if (!form.height.trim()) {
    return 'Height is required';
  }
  if (!form.weight.trim()) {
    return 'Weight is required';
  }
  if (!form.gender) {
    return 'Please select your gender';
  }
  if (!form.bodyShape) {
    return 'Please select your body shape';
  }
  return null;
}

function FormField({
  label,
  keyboardType,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A58D78"
        style={styles.fieldInput}
        value={value}
      />
    </View>
  );
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { authUser, profile, saveProfile } = useAuth();
  const [form, setForm] = useState<FormState>({
    age: profile?.age ?? '',
    bodyShape: profile?.bodyShape ?? '',
    country: profile?.country ?? '',
    firstName: profile?.firstName ?? '',
    gender: profile?.gender ?? '',
    height: profile?.height ?? '',
    lastName: profile?.lastName ?? '',
    weight: profile?.weight ?? '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const validationError = validateProfile(form);
    if (validationError) {
      Alert.alert('Profile', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await saveProfile({
        age: form.age.trim(),
        bodyShape: form.bodyShape,
        country: form.country.trim(),
        firstName: form.firstName.trim(),
        gender: form.gender,
        height: form.height.trim(),
        lastName: form.lastName.trim(),
        weight: form.weight.trim(),
      });
      Alert.alert('Profile', 'Profile saved successfully!');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Profile',
        error instanceof Error ? error.message : 'Failed to save profile. Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Complete your profile</Text>
          <Text style={styles.subheading}>
            {authUser?.email ?? 'Signed in user'} needs a finished profile before entering the app.
          </Text>

          <View style={styles.card}>
            <FormField
              label="First Name"
              onChangeText={(value) => updateForm('firstName', value)}
              placeholder="First name"
              value={form.firstName}
            />
            <FormField
              label="Last Name"
              onChangeText={(value) => updateForm('lastName', value)}
              placeholder="Last name"
              value={form.lastName}
            />
            <FormField
              label="Country"
              onChangeText={(value) => updateForm('country', value)}
              placeholder="Country"
              value={form.country}
            />
            <FormField
              keyboardType="number-pad"
              label="Age"
              onChangeText={(value) => updateForm('age', value)}
              placeholder="Age"
              value={form.age}
            />
            <FormField
              keyboardType="number-pad"
              label="Height"
              onChangeText={(value) => updateForm('height', value)}
              placeholder="Height"
              value={form.height}
            />
            <FormField
              keyboardType="number-pad"
              label="Weight"
              onChangeText={(value) => updateForm('weight', value)}
              placeholder="Weight"
              value={form.weight}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.chipRow}>
                {genderOptions.map((option) => {
                  const selected = form.gender === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => updateForm('gender', option)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}>
                      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Body Shape</Text>
              <View style={styles.chipRow}>
                {bodyShapeOptions.map((option) => {
                  const selected = form.bodyShape === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => updateForm('bodyShape', option)}
                      style={[styles.chip, selected ? styles.chipSelected : null]}>
                      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !isSubmitting ? styles.primaryButtonPressed : null,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF7F1" />
              ) : (
                <Text style={styles.primaryButtonText}>Save profile</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF9F4',
    borderRadius: 28,
    gap: 16,
    padding: 22,
  },
  chip: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipSelected: {
    backgroundColor: '#D96F32',
    borderColor: '#D96F32',
  },
  chipText: {
    color: '#5C4638',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFF7F1',
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 40,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldInput: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 18,
    borderWidth: 1,
    color: '#2F241D',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    color: '#5C4638',
    fontSize: 13,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
  heading: {
    color: '#2F241D',
    fontSize: 30,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#D96F32',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFF7F1',
    fontSize: 16,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: '#F2E2D6',
    flex: 1,
  },
  subheading: {
    color: '#7F6755',
    fontSize: 14,
    lineHeight: 21,
  },
});
