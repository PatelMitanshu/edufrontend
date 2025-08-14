import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import MCQNavigator from './MCQNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MCQTests'>;

const MCQTestsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { studentId } = route.params;

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <MCQNavigator
      studentId={studentId}
      onGoBack={handleGoBack}
    />
  );
};

export default MCQTestsScreen;
