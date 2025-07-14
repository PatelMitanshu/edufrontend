import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

const { width, height } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  delay: number;
}

interface TeamMemberProps {
  name: string;
  role: string;
  avatar: string;
  delay: number;
}

interface StatProps {
  number: string;
  label: string;
  icon: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay }) => {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['mb-4'], tw['shadow-xl'], tw['border'], tw['border-surface'],
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[tw['w-16'], tw['h-16'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-4'], { backgroundColor: color }]}>
        <Text style={[tw['text-3xl']]}>{icon}</Text>
      </View>
      <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary'], tw['mb-2']]}>
        {title}
      </Text>
      <Text style={[tw['text-base'], tw['text-secondary'], tw['leading-relaxed']]}>
        {description}
      </Text>
    </Animated.View>
  );
};

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, avatar, delay }) => {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: delay,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        tw['items-center'], tw['mr-4'],
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[tw['w-20'], tw['h-20'], tw['bg-gradient-blue'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-3'], tw['shadow-xl']]}>
        <Text style={[tw['text-3xl']]}>{avatar}</Text>
      </View>
      <Text style={[tw['text-sm'], tw['font-bold'], tw['text-primary'], tw['text-center']]}>
        {name}
      </Text>
      <Text style={[tw['text-xs'], tw['text-secondary'], tw['text-center']]}>
        {role}
      </Text>
    </Animated.View>
  );
};

const StatCard: React.FC<StatProps> = ({ number, label, icon, delay }) => {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayNumber, setDisplayNumber] = useState('0');

  React.useEffect(() => {
    Animated.timing(countAnim, {
      toValue: 1,
      duration: 2000,
      delay: delay,
      useNativeDriver: false,
    }).start();

    countAnim.addListener(({ value }) => {
      const currentNumber = Math.floor(value * parseInt(number));
      setDisplayNumber(currentNumber.toString());
    });

    return () => {
      countAnim.removeAllListeners();
    };
  }, []);

  return (
    <View style={[tw['items-center'], tw['flex-1']]}>
      <View style={[tw['w-16'], tw['h-16'], tw['bg-blue-100'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-3']]}>
        <Text style={[tw['text-2xl']]}>{icon}</Text>
      </View>
      <Text style={[tw['text-3xl'], tw['font-extrabold'], tw['text-blue-600'], tw['mb-1']]}>
        {displayNumber}+
      </Text>
      <Text style={[tw['text-sm'], tw['text-secondary'], tw['text-center'], tw['font-medium']]}>
        {label}
      </Text>
    </View>
  );
};

function AboutScreen() {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const [activeTab, setActiveTab] = useState<'about' | 'features' | 'team'>('about');
  const headerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContact = (type: 'email' | 'website' | 'phone') => {
    switch (type) {
      case 'email':
        Linking.openURL('mailto:support@edulearn.com').catch(() =>
          Alert.alert('Error', 'Could not open email client')
        );
        break;
      case 'website':
        Linking.openURL('https://edulearn.com').catch(() =>
          Alert.alert('Error', 'Could not open website')
        );
        break;
      case 'phone':
        Linking.openURL('tel:+1234567890').catch(() =>
          Alert.alert('Error', 'Could not open phone dialer')
        );
        break;
    }
  };

  const features = [
    {
      icon: '📚',
      title: 'Smart Learning',
      description: 'AI-powered learning paths tailored to each student\'s needs and learning style.',
      color: '#E3F2FD',
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Real-time analytics and detailed progress reports for teachers and parents.',
      color: '#F3E5F5',
    },
    {
      icon: '🎯',
      title: 'Goal Setting',
      description: 'Set and track academic goals with milestone achievements and rewards.',
      color: '#E8F5E8',
    },
    {
      icon: '🌐',
      title: 'Cloud Sync',
      description: 'Access your work anywhere with secure cloud synchronization.',
      color: '#FFF3E0',
    },
  ];

  const teamMembers = [
    { name: 'Mitanshu Patel', role: 'Lead Developer', avatar: '👨‍💻' },
    { name: 'Sarah Johnson', role: 'UI/UX Designer', avatar: '👩‍🎨' },
    { name: 'Mike Chen', role: 'Backend Engineer', avatar: '👨‍⚙️' },
    { name: 'Emily Davis', role: 'Product Manager', avatar: '👩‍💼' },
  ];

  const stats = [
    { number: '999', label: 'Students', icon: '👨‍🎓' },
    { number: '50', label: 'Teachers', icon: '👩‍🏫' },
    { number: '25', label: 'Schools', icon: '🏫' },
    { number: '95', label: 'Success Rate', icon: '📈' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <View>
            {/* Hero Section */}
            <Animated.View
              style={[
                tw['bg-gradient-blue'], tw['rounded-3xl'], tw['p-4'], tw['mb-6'], tw['items-center'],
                {
                  opacity: headerAnim,
                  transform: [
                    {
                      translateY: headerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[tw['w-24'], tw['h-24'], tw['bg-surface'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-4'], tw['shadow-xl']]}>
                <Text style={[tw['text-4xl']]}>🎓</Text>
              </View>
              <Text style={[tw['text-3xl'], tw['font-extrabold'], tw['text-white'], tw['text-center'], tw['mb-2']]}>
                EduLearn
              </Text>
              <Text style={[tw['text-lg'], tw['text-white'], tw['text-center'], tw['mb-4']]}>
                Revolutionizing Education Through Technology
              </Text>
              <Text style={[tw['text-base'], tw['text-white'], tw['text-center'], tw['leading-relaxed']]}>
                Empowering teachers and students with innovative tools for modern education
              </Text>
            </Animated.View>

            {/* Mission Section */}
            <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['mb-6'], tw['shadow-lg']]}>
              <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}>
                <View style={[tw['w-12'], tw['h-12'], tw['bg-success'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3']]}>
                  <Text style={[tw['text-2xl']]}>🎯</Text>
                </View>
                <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary']]}>
                  Our Mission
                </Text>
              </View>
              <Text style={[tw['text-base'], tw['text-secondary'], tw['leading-relaxed'], tw['mb-4']]}>
                To bridge the gap between traditional education and modern technology, creating an inclusive learning environment where every student can thrive.
              </Text>
              <Text style={[tw['text-base'], tw['text-secondary'], tw['leading-relaxed']]}>
                We believe that education should be personalized, engaging, and accessible to all, regardless of their background or learning style.
              </Text>
            </View>

            {/* Statistics */}
            <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-1'], tw['mb-6'], tw['shadow-lg'] ]}>
              <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary'], tw['text-center'], tw['mb-6']]}>
                Our Impact
              </Text>
              <View style={[tw['flex-row'], tw['justify-between']]}>
                {stats.map((stat, index) => (
                  <StatCard
                    key={index}
                    number={stat.number}
                    label={stat.label}
                    icon={stat.icon}
                    delay={index * 200}
                  />
                ))}
              </View>
            </View>

            {/* Contact Section */}
            <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-2'], tw['shadow-lg']]}>
              <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary'], tw['mb-4']]}>
                Get in Touch
              </Text>
              <View style={[tw['flex-row'], tw['justify-between']]}>
                <TouchableOpacity
                  style={[tw['flex-1'], tw['bg-blue-50'], tw['rounded-xl'], tw['p-4'], tw['items-center'], tw['mr-2']]}
                  onPress={() => handleContact('email')}
                  activeOpacity={0.7}
                >
                  <Text style={[tw['text-2xl'], tw['mb-2']]}>📧</Text>
                  <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary']]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[tw['flex-1'], tw['bg-success'], tw['rounded-xl'], tw['p-4'], tw['items-center'], tw['mx-4']]}
                  onPress={() => handleContact('phone')}
                  activeOpacity={0.7}
                >
                  <Text style={[tw['text-2xl'], tw['mb-2']]}>📞</Text>
                  <Text style={[tw['text-sm'], tw['font-medium'], tw['text-white']]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[tw['flex-1'], tw['bg-primary-light'], tw['rounded-xl'], tw['p-4'], tw['items-center'], tw['ml-2']]}
                  onPress={() => handleContact('website')}
                  activeOpacity={0.7}
                >
                  <Text style={[tw['text-2xl'], tw['mb-2']]}>🌐</Text>
                  <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary']]}>Website</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'features':
        return (
          <View>
            <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
              Features That Make a Difference
            </Text>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                delay={index * 200}
              />
            ))}
          </View>
        );

      case 'team':
        return (
          <View>
            <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
              Meet Our Amazing Team
            </Text>
            <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['shadow-lg'], tw['mb-6']]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[tw['py-4']]}>
                {teamMembers.map((member, index) => (
                  <TeamMember
                    key={index}
                    name={member.name}
                    role={member.role}
                    avatar={member.avatar}
                    delay={index * 300}
                  />
                ))}
              </ScrollView>
            </View>
            
            <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['shadow-lg']]}>
              <Text style={[tw['text-lg'], tw['font-bold'], tw['text-primary'], tw['mb-3']]}>
                Why Choose Our Team?
              </Text>
              <Text style={[tw['text-base'], tw['text-secondary'], tw['leading-relaxed'], tw['mb-4']]}>
                Our diverse team brings together expertise in education, technology, and design to create solutions that truly make a difference.
              </Text>
              <View style={[tw['flex-row'], tw['items-center'], tw['mb-2']]}>
                <Text style={[tw['text-lg'], tw['mr-2']]}>✨</Text>
                <Text style={[tw['text-sm'], tw['text-secondary']]}>10+ years combined experience in EdTech</Text>
              </View>
              <View style={[tw['flex-row'], tw['items-center'], tw['mb-2']]}>
                <Text style={[tw['text-lg'], tw['mr-2']]}>🎓</Text>
                <Text style={[tw['text-sm'], tw['text-secondary']]}>Former educators and industry experts</Text>
              </View>
              <View style={[tw['flex-row'], tw['items-center']]}>
                <Text style={[tw['text-lg'], tw['mr-2']]}>🚀</Text>
                <Text style={[tw['text-sm'], tw['text-secondary']]}>Passionate about innovation in education</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      
      {/* Header */}
      <View style={[tw['bg-surface'], tw['px-5'], tw['py-6'], tw['shadow-lg'], tw['border-b'], tw['border-surface']]}>
        <View style={[tw['flex-row'], tw['items-center']]}>
          <View style={[tw['w-12'], tw['h-12'], tw['bg-gradient-blue'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3'], tw['shadow-colored-blue']]}>
            <Text style={[tw['text-xl'], tw['text-white']]}>ℹ️</Text>
          </View>
          <View>
            <Text style={[tw['text-xl'], tw['font-extrabold'], tw['text-primary'], tw['tracking-wide']]}>
              About EduLearn
            </Text>
            <Text style={[tw['text-sm'], tw['text-secondary'], tw['font-medium']]}>
              Learn more about us
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[tw['bg-surface'], tw['px-5'], tw['py-4'], tw['border-b'], tw['border-surface']]}>
        <View style={[tw['flex-row'], tw['bg-background'], tw['rounded-2xl'], tw['p-1']]}>
          {[
            { key: 'about', label: 'About', icon: '🏢' },
            { key: 'features', label: 'Features', icon: '⚡' },
            { key: 'team', label: 'Team', icon: '👥' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                tw['flex-1'], tw['py-3'], tw['rounded-xl'], tw['items-center'],
                activeTab === tab.key && tw['bg-surface'], tw['shadow-sm']
              ]}
              onPress={() => setActiveTab(tab.key as any)}
              activeOpacity={0.7}
            >
              <Text style={[tw['text-base']]}>{tab.icon}</Text>
              <Text style={[
                tw['text-sm'], tw['font-medium'],
                activeTab === tab.key ? tw['text-primary'] : tw['text-secondary']
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={[tw['flex-1']]} showsVerticalScrollIndicator={false}>
        <View style={[tw['p-5']]}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default AboutScreen;
