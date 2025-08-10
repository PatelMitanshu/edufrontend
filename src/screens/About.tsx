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
        tw['rounded-3xl'], tw['p-6'], tw['mb-6'], tw['relative'],
        {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          shadowColor: color,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
          overflow: 'hidden',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Floating Background Element */}
      <View style={[
        {
          position: 'absolute',
          top: -10,
          right: -10,
          width: 40,
          height: 40,
          backgroundColor: color + '20',
          borderRadius: 20,
        }
      ]} />
      
      <View style={[
        tw['w-20'], tw['h-20'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-4'],
        {
          backgroundColor: color + '30',
          shadowColor: color,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
          elevation: 8,
        }
      ]}>
        <Text style={[tw['text-4xl']]}>{icon}</Text>  
      </View>
      <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary'], tw['mb-3']]}>
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
      <View style={[
        tw['w-20'], tw['h-20'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-4'],
        {
          backgroundColor: 'rgba(74, 144, 226, 0.15)',
          shadowColor: '#4A90E2',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 8,
          borderWidth: 2,
          borderColor: 'rgba(74, 144, 226, 0.2)',
        }
      ]}>
        <Text style={[tw['text-2xl']]}>{icon}</Text>
      </View>
      <Text style={[tw['text-4xl'], tw['font-extrabold'], tw['text-primary'], tw['mb-2']]}>
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
            {/* Hero Section with Modern Glassmorphism */}
            <Animated.View
              style={[
                tw['rounded-3xl'], tw['p-6'], tw['mb-6'], tw['items-center'], tw['relative'],
                {
                  backgroundColor: 'rgba(74, 144, 226, 0.15)',
                  borderColor: 'rgba(74, 144, 226, 0.2)',
                  borderWidth: 1,
                  shadowColor: '#4A90E2',
                  shadowOffset: { width: 0, height: 20 },
                  shadowOpacity: 0.25,
                  shadowRadius: 25,
                  elevation: 10,
                  overflow: 'hidden',
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
              {/* Floating Background Elements */}
              <View style={[
                {
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 40,
                  height: 40,
                  backgroundColor: 'rgba(74, 144, 226, 0.1)',
                  borderRadius: 20,
                }
              ]} />
              <View style={[
                {
                  position: 'absolute',
                  bottom: -15,
                  left: -15,
                  width: 60,
                  height: 60,
                  backgroundColor: 'rgba(74, 144, 226, 0.08)',
                  borderRadius: 30,
                }
              ]} />
              
              {/* Enhanced Profile Icon with Glow Effect */}
              <View style={[
                tw['w-24'], tw['h-24'], tw['bg-surface'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mb-6'],
                {
                  width: 112,
                  height: 112,
                  shadowColor: '#4A90E2',
                  shadowOffset: { width: 0, height: 15 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 15,
                  borderWidth: 3,
                  borderColor: 'rgba(74, 144, 226, 0.2)',
                }
              ]}>
                <Text style={[tw['text-5xl']]}>🎓</Text>
              </View>
              
              {/* Enhanced Text with Better Typography */}
              <Text style={[tw['text-4xl'], tw['font-extrabold'], tw['text-primary'], tw['text-center'], tw['mb-3']]}>
                EduLearn
              </Text>
              <Text style={[tw['text-lg'], tw['text-primary'], tw['text-center'], tw['mb-4'], { opacity: 0.8 }]}>
                Revolutionizing Education Through Technology
              </Text>
              <Text style={[tw['text-base'], tw['text-secondary'], tw['text-center'], tw['leading-relaxed']]}>
                Empowering teachers and students with innovative tools for modern education
              </Text>
            </Animated.View>

            {/* Mission Section with Glassmorphism */}
            <View style={[
              tw['rounded-3xl'], tw['p-6'], tw['mb-6'], tw['relative'],
              {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 8,
                overflow: 'hidden',
              }
            ]}>
              {/* Decorative Elements */}
              <View style={[
                {
                  position: 'absolute',
                  top: -5,
                  left: -5,
                  width: 30,
                  height: 30,
                  backgroundColor: 'rgba(52, 168, 83, 0.1)',
                  borderRadius: 15,
                }
              ]} />
              
              <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}>
                <View style={[
                  tw['w-16'], tw['h-16'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-4'],
                  {
                    backgroundColor: 'rgba(52, 168, 83, 0.15)',
                    shadowColor: '#34a853',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.2,
                    shadowRadius: 15,
                    elevation: 8,
                  }
                ]}>
                  <Text style={[tw['text-3xl']]}>🎯</Text>
                </View>
                <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary']]}>
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

            {/* Statistics with Enhanced Design */}
            <View style={[
              tw['rounded-3xl'], tw['p-6'], tw['mb-6'], tw['relative'],
              {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: 'rgba(74, 144, 226, 0.15)',
                borderWidth: 1,
                shadowColor: '#4A90E2',
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: 0.15,
                shadowRadius: 25,
                elevation: 10,
                overflow: 'hidden',
              }
            ]}>
              {/* Background Gradient Overlay */}
              <View style={[
                {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 100,
                  height: 100,
                  backgroundColor: 'rgba(74, 144, 226, 0.05)',
                  borderRadius: 50,
                  transform: [{ translateX: 30 }, { translateY: -30 }],
                }
              ]} />
              
              <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['text-center'], tw['mb-6']]}>
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

            {/* Contact Section with Modern Design */}
            <View style={[
              tw['rounded-3xl'], tw['p-6'], tw['relative'],
              {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.12,
                shadowRadius: 22,
                elevation: 10,
                overflow: 'hidden',
              }
            ]}>
              {/* Decorative Background Elements */}
              <View style={[
                {
                  position: 'absolute',
                  bottom: -10,
                  right: -10,
                  width: 50,
                  height: 50,
                  backgroundColor: 'rgba(74, 144, 226, 0.08)',
                  borderRadius: 25,
                }
              ]} />
              
              <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6']]}>
                Get in Touch
              </Text>
              <View style={[tw['flex-row'], tw['justify-between']]}>
                <TouchableOpacity
                  style={[
                    tw['flex-1'], tw['rounded-xl'], tw['p-4'], tw['items-center'], tw['mr-2'],
                    {
                      backgroundColor: 'rgba(74, 144, 226, 0.1)',
                      borderColor: 'rgba(74, 144, 226, 0.2)',
                      borderWidth: 1,
                      shadowColor: '#4A90E2',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }
                  ]}
                  onPress={() => handleContact('email')}
                  activeOpacity={0.7}
                >
                  <Text style={[tw['text-2xl'], tw['mb-2']]}>📧</Text>
                  <Text style={[tw['text-sm'], tw['font-medium'], tw['text-primary']]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    tw['flex-1'], tw['rounded-xl'], tw['p-4'], tw['items-center'],
                    {
                      marginHorizontal: 4,
                      backgroundColor: 'rgba(52, 168, 83, 0.15)',
                      borderColor: 'rgba(52, 168, 83, 0.25)',
                      borderWidth: 1,
                      shadowColor: '#34a853',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }
                  ]}
                  onPress={() => handleContact('phone')}
                  activeOpacity={0.7}
                >
                  <Text style={[tw['text-2xl'], tw['mb-2']]}>📞</Text>
                  <Text style={[tw['text-sm'], tw['font-medium'], tw['text-primary']]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    tw['flex-1'], tw['rounded-xl'], tw['p-4'], tw['items-center'], tw['ml-2'],
                    {
                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                      borderColor: 'rgba(156, 39, 176, 0.2)',
                      borderWidth: 1,
                      shadowColor: '#9c27b0',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }
                  ]}
                  onPress={() => handleContact('website')}
                  activeOpacity={0.7}
                >
                  <Text style={[tw['text-2xl'], tw['mb-2']]}>🌐</Text>
                  <Text style={[tw['text-sm'], tw['font-medium'], tw['text-primary']]}>Website</Text>
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
