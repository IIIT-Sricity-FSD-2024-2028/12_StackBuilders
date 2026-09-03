export type TrackInputType = 'number' | 'text' | 'select';

export interface TrackField {
  name: string;
  label: string;
  inputType: TrackInputType;
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  options?: readonly string[];
}

export interface TrackDefinition {
  key: string;
  fields: readonly TrackField[];
}

export const TRACK_CONFIG: Record<
  'mental' | 'nutrition' | 'physical',
  TrackDefinition
> = {
  mental: {
    key: 'mental',
    fields: [
      {
        name: 'moodScore',
        label: 'Mood score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'stressScore',
        label: 'Stress score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'sleepHours',
        label: 'Sleep last night (hours)',
        inputType: 'number',
        min: 0,
        max: 16,
        step: 0.5,
        required: true,
      },
      {
        name: 'focusScore',
        label: 'Focus score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'anxietyTrigger',
        label: 'Main stress trigger today',
        inputType: 'text',
        required: true,
      },
      {
        name: 'supportNeeded',
        label: 'Support needed',
        inputType: 'select',
        options: [
          'No immediate support needed',
          'Would like a follow-up this week',
          'Need support as soon as possible',
        ],
        required: true,
      },
    ],
  },
  nutrition: {
    key: 'nutrition',
    fields: [
      {
        name: 'mealConsistency',
        label: 'Meal plan consistency',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'waterIntakeLiters',
        label: 'Water intake today',
        inputType: 'number',
        min: 0,
        max: 10,
        step: 0.1,
        required: true,
      },
      {
        name: 'energyScore',
        label: 'Energy score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'servingsCount',
        label: 'Fruit and vegetable servings',
        inputType: 'number',
        min: 0,
        max: 20,
        step: 1,
        required: true,
      },
      {
        name: 'nutritionGoal',
        label: 'Primary nutrition goal',
        inputType: 'select',
        options: [
          'Weight management',
          'More energy during work',
          'Better digestion',
          'Muscle gain or recovery',
          'Improve eating consistency',
        ],
        required: true,
      },
      {
        name: 'dietChallenge',
        label: 'Biggest diet challenge today',
        inputType: 'text',
        required: true,
      },
    ],
  },
  physical: {
    key: 'physical',
    fields: [
      {
        name: 'activityMinutes',
        label: 'Active minutes today',
        inputType: 'number',
        min: 0,
        max: 1440,
        step: 1,
        required: true,
      },
      {
        name: 'stepCount',
        label: 'Steps today',
        inputType: 'number',
        min: 0,
        max: 100000,
        step: 1,
        required: true,
      },
      {
        name: 'painScore',
        label: 'Pain or soreness score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'mobilityScore',
        label: 'Mobility score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'recoveryScore',
        label: 'Recovery score',
        inputType: 'number',
        min: 1,
        max: 10,
        step: 1,
        required: true,
      },
      {
        name: 'workoutFocus',
        label: 'Workout focus',
        inputType: 'select',
        options: [
          'Walking or cardio',
          'Strength training',
          'Mobility or stretching',
          'Yoga or mindfulness movement',
          'Recovery day',
        ],
        required: true,
      },
    ],
  },
};

export type TrackKey = keyof typeof TRACK_CONFIG;

export const ALL_TRACK_FIELD_NAMES = Array.from(
  new Set(
    Object.values(TRACK_CONFIG)
      .flatMap((track) => track.fields)
      .map((field) => field.name),
  ),
);
