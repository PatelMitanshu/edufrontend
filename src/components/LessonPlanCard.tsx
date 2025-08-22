import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { tw } from '../utils/tailwind';
import { useTheme } from '../contexts/ThemeContext';
import { LessonPlan, LessonPlanMaterial } from '../services/lessonPlanService';
import ImageViewer from './ImageViewer';
import SimpleVideoPlayer from './SimpleVideoPlayer';
import InlineWebVideo from './InlineWebVideo';
import FileViewer from './FileViewer';

interface LessonPlanCardProps {
  lessonPlan: LessonPlan;
  onEdit: (lessonPlan: LessonPlan) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const LessonPlanCard: React.FC<LessonPlanCardProps> = ({
  lessonPlan,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const { theme } = useTheme();
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; title: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; title: string; type: string; mimeType?: string } | null>(null);

  const handleMaterialPress = (material: LessonPlan['materials'][0]) => {
    if (material.type === 'photo') {
      setSelectedMedia({ uri: material.content, title: material.title || 'Image' });
      setImageViewerVisible(true);
    } else if (material.type === 'video') {
      setSelectedMedia({ uri: material.content, title: material.title || 'Video' });
      setVideoPlayerVisible(true);
    } else if (material.type === 'link') {
      Linking.openURL(material.content).catch(() => {
        Alert.alert('Error', 'Could not open the link');
      });
    } else if (material.type === 'text') {
      Alert.alert(material.title || 'Text Content', material.content);
    } else if (material.type === 'document') {
      // Use the in-app FileViewer for documents instead of opening externally
      const fileExtension = material.content.split('.').pop()?.toLowerCase() || '';
      let mimeType = 'application/pdf'; // Default to PDF
      
      // Determine MIME type based on file extension
      if (fileExtension === 'pdf') {
        mimeType = 'application/pdf';
      } else if (['doc', 'docx'].includes(fileExtension)) {
        mimeType = 'application/msword';
      } else if (['xls', 'xlsx'].includes(fileExtension)) {
        mimeType = 'application/vnd.ms-excel';
      } else if (['ppt', 'pptx'].includes(fileExtension)) {
        mimeType = 'application/vnd.ms-powerpoint';
      } else if (fileExtension === 'txt') {
        mimeType = 'text/plain';
      }
      
      setSelectedFile({ 
        uri: material.content, 
        title: material.title || 'Document', 
        type: 'document',
        mimeType: mimeType
      });
      setFileViewerVisible(true);
    }
  };

  const renderMaterial = (material: LessonPlan['materials'][0], index: number) => {
    const getIcon = () => {
      switch (material.type) {
        case 'photo':
          return '📷';
        case 'video':
          return '🎥';
        case 'text':
          return '📝';
        case 'link':
          return '🔗';
        case 'document':
          return '📄';
        default:
          return '📄';
      }
    };

    return (
      <TouchableOpacity
        key={index}
        style={[
          tw['bg-gray-100'],
          tw['px-3'],
          tw['py-2'],
          tw['rounded-xl'],
          tw['mr-2'],
          tw['mb-2'],
          tw['flex-row'],
          tw['items-center'],
        ]}
        onPress={() => handleMaterialPress(material)}
      >
        <Text style={[tw['text-base'], tw['mr-2']]}>{getIcon()}</Text>
        <Text style={[tw['text-xs'], tw['text-gray-800'], tw['font-medium']]}>
          {material.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        tw['bg-white'],
        tw['rounded-xl'],
        tw['mb-4'],
        tw['shadow-lg'],
        tw['overflow-hidden'],
        tw['border'],
        tw['border-gray-200'],
        lessonPlan.completed && tw['opacity-50'],
      ]}
    >
      {/* Status Bar */}
      <View
        style={[
          { width: '100%', height: 8 },
          lessonPlan.completed ? tw['bg-green-500'] : tw['bg-blue-500'],
        ]}
      />

      <View style={[tw['p-5']]}>
        {/* Header */}
        <View style={[tw['flex-row'], tw['items-center'], tw['justify-between'], tw['mb-3']]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}>
            <View
              style={[
                tw['w-12'],
                tw['h-12'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                tw['mr-3'],
                lessonPlan.completed ? tw['bg-green-500'] : tw['bg-blue-500'],
              ]}
            >
              <Text style={[tw['text-xl']]}>{lessonPlan.completed ? '✅' : '📖'}</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text
                style={[
                  tw['text-lg'],
                  tw['font-bold'],
                  tw['text-gray-800'],
                  tw['mb-1'],
                  lessonPlan.completed && { textDecorationLine: 'line-through' },
                ]}
              >
                {lessonPlan.subject}
              </Text>
              <Text style={[tw['text-sm'], tw['text-gray-600'], tw['font-medium']]}>
                {lessonPlan.topic}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[tw['flex-row'], tw['items-center']]}>
            <TouchableOpacity
              style={[
                tw['w-8'],
                tw['h-8'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                tw['mr-2'],
                lessonPlan.completed ? tw['bg-gray-100'] : tw['bg-green-500'],
              ]}
              onPress={() => onToggleComplete(lessonPlan.id || lessonPlan._id || '')}
            >
              <Text style={[tw['text-sm']]}>{lessonPlan.completed ? '↻' : '✓'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tw['w-8'],
                tw['h-8'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                tw['mr-2'],
                tw['bg-blue-100'],
              ]}
              onPress={() => onEdit(lessonPlan)}
            >
              <Text style={[tw['text-sm']]}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tw['w-8'],
                tw['h-8'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                tw['bg-red-500'],
              ]}
              onPress={() => onDelete(lessonPlan.id || lessonPlan._id || '')}
            >
              <Text style={[tw['text-sm']]}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Time & Duration - Fixed Overflow */}
        <View style={[tw['mb-3']]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['flex-wrap']]}>
            <View style={[tw['bg-blue-500'], tw['px-3'], tw['py-1'], tw['rounded-full'], tw['mr-2'], tw['mb-2'], { maxWidth: 120 }]}>
              <Text style={[tw['text-xs'], tw['text-white'], tw['font-medium'], tw['text-center']] } numberOfLines={1}>
                📅 {new Date(lessonPlan.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={[tw['bg-blue-500'], tw['px-3'], tw['py-1'], tw['rounded-full'], tw['mr-2'], tw['mb-2'], { maxWidth: 80 }]}>
              <Text style={[tw['text-xs'], tw['text-white'], tw['font-medium'], tw['text-center']] } numberOfLines={1}>
                🕐 {lessonPlan.startTime}
              </Text>
            </View>
            <View style={[tw['bg-blue-500'], tw['px-3'], tw['py-1'], tw['rounded-full'], tw['mr-2'], tw['mb-2'], { maxWidth: 80 }]}>
              <Text style={[tw['text-xs'], tw['text-white'], tw['font-medium'], tw['text-center']] } numberOfLines={1}>
                ⏱️ {lessonPlan.duration}m
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {lessonPlan.description ? (
          <Text style={[tw['text-sm'], tw['text-gray-600'], tw['mb-3'], { lineHeight: 20 }]}>
            {lessonPlan.description}
          </Text>
        ) : null}

        {/* Materials */}
        {lessonPlan.materials.length > 0 && (
          <View style={[tw['mb-2']]}>
            <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
              Teaching Materials:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[tw['flex-row'], tw['flex-wrap']]}>
                {lessonPlan.materials.map((material, index) => renderMaterial(material, index))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Media Viewers */}
      {selectedMedia && (
        <>
          <ImageViewer
            visible={imageViewerVisible}
            imageUri={selectedMedia.uri}
            title={selectedMedia.title}
            onClose={() => {
              setImageViewerVisible(false);
              setSelectedMedia(null);
            }}
          />
          {/* Prefer in-app WebView player */}
          <InlineWebVideo
            visible={videoPlayerVisible}
            videoUri={selectedMedia.uri}
            title={selectedMedia.title}
            onClose={() => {
              setVideoPlayerVisible(false);
              // keep selected media so image viewer can still use it separately
              setSelectedMedia(null);
            }}
          />
          {/* Keep external fallback if needed
          <SimpleVideoPlayer
            visible={false}
            videoUri={selectedMedia.uri}
            title={selectedMedia.title}
            onClose={() => {
              setVideoPlayerVisible(false);
              setSelectedMedia(null);
            }}
          />
          */}
        </>
      )}

      {/* File Viewer for Documents */}
      {selectedFile && (
        <FileViewer
          visible={fileViewerVisible}
          onClose={() => {
            setFileViewerVisible(false);
            setSelectedFile(null);
          }}
          fileUrl={selectedFile.uri}
          fileType={selectedFile.type}
          fileName={selectedFile.title}
          mimeType={selectedFile.mimeType || 'application/pdf'}
        />
      )}
    </View>
  );
};

export default LessonPlanCard;
