import React, { useState } from 'react';
import MCQTestList from './MCQTestList';
import TakeTest from './TakeTest';
import TestResult from './TestResult';
import TestHistory from './TestHistory';
import { MCQTest } from '../services/studentMCQService';

interface MCQNavigatorProps {
  studentId: string;
  onGoBack: () => void;
}

type Screen = 'testList' | 'takeTest' | 'testResult' | 'testHistory';

interface NavigationState {
  screen: Screen;
  params?: any;
}

const MCQNavigator: React.FC<MCQNavigatorProps> = ({
  studentId,
  onGoBack,
}) => {
  const [navigation, setNavigation] = useState<NavigationState>({
    screen: 'testList',
  });

  const navigateToTest = (testId: string, test: MCQTest) => {
    setNavigation({
      screen: 'takeTest',
      params: { testId, test },
    });
  };

  const navigateToResult = (result: any) => {
    const submissionId = result?.result?.submissionId;
    
    if (!submissionId) {return;
    }
    
    setNavigation({
      screen: 'testResult',
      params: { submissionId },
    });
  };

  const navigateToHistory = (studentId: string) => {
    setNavigation({
      screen: 'testHistory',
      params: { studentId },
    });
  };

  const navigateToTestList = () => {
    setNavigation({
      screen: 'testList',
    });
  };

  const navigateBack = () => {
    switch (navigation.screen) {
      case 'takeTest':
      case 'testHistory':
        navigateToTestList();
        break;
      case 'testResult':
        navigateToTestList();
        break;
      default:
        onGoBack();
        break;
    }
  };

  const renderScreen = () => {
    switch (navigation.screen) {
      case 'testList':
        return (
          <MCQTestList
            studentId={studentId}
            onNavigateToTest={navigateToTest}
            onNavigateToHistory={navigateToHistory}
          />
        );

      case 'takeTest':
        return (
          <TakeTest
            studentId={studentId}
            testId={navigation.params.testId}
            onTestComplete={navigateToResult}
            onGoBack={navigateBack}
          />
        );

      case 'testResult':
        return (
          <TestResult
            submissionId={navigation.params.submissionId}
            onGoBack={navigateBack}
            onGoToTests={navigateToTestList}
          />
        );

      case 'testHistory':
        return (
          <TestHistory
            studentId={studentId}
            onGoBack={navigateBack}
            onViewResult={(submissionId) =>
              setNavigation({
                screen: 'testResult',
                params: { submissionId },
              })
            }
          />
        );

      default:
        return (
          <MCQTestList
            studentId={studentId}
            onNavigateToTest={navigateToTest}
            onNavigateToHistory={navigateToHistory}
          />
        );
    }
  };

  return renderScreen();
};

export default MCQNavigator;
