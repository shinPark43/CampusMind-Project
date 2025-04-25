import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  LogBox,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components/theme';

// Ignore text measurement warnings
LogBox.ignoreLogs(['Error measuring text field']);

const { width } = Dimensions.get('window');

// Custom Text component to avoid measurement warnings
const Text = (props) => {
  const { style, ...otherProps } = props;
  return (
    <View style={{ minWidth: 10 }}>
      <RNText 
        {...otherProps} 
        style={[{ fontSize: 16, includeFontPadding: false }, style]}
        maxFontSizeMultiplier={1}
        minimumFontScale={1}
        allowFontScaling={false}
      />
    </View>
  );
};

Text.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const Message = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  sender: PropTypes.oneOf(['user', 'bot']).isRequired,
  timestamp: PropTypes.instanceOf(Date).isRequired,
  webResults: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string,
    snippet: PropTypes.string,
    link: PropTypes.string,
  })),
});

export default function ChatbotTab() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Add initial greeting message
    const greetingMessage = {
      id: 'greeting',
      text: "Hello! I'm your Gym Assistant. I can help you with information about:\n\n• Gym facilities and equipment\n• Operating hours\n• Sports programs and classes\n• Rules and guidelines\n• Membership information\n\nWhat would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([greetingMessage]);
  }, []);

  const handleReset = () => {
    Alert.alert(
      'Reset Chat',
      'Are you sure you want to clear the conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const greetingMessage = {
              id: 'greeting',
              text: "Hello! I'm your Gym Assistant. I can help you with information about:\n\n• Gym facilities and equipment\n• Operating hours\n• Sports programs and classes\n• Rules and guidelines\n• Membership information\n\nWhat would you like to know?",
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages([greetingMessage]);
            setInputText('');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        webResults: data.webResults,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWebResults = (webResults) => {
    if (!webResults || webResults.length === 0) return null;

    return (
      <View style={styles.webResultsContainer}>
        <Text 
          style={styles.webResultsTitle}
          allowFontScaling={false}
          adjustsFontSizeToFit={false}
        >
          Web Search Results:
        </Text>
        {webResults.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={styles.webResultItem}
            onPress={() => Linking.openURL(result.link)}
          >
            <Text 
              style={styles.webResultTitle}
              allowFontScaling={false}
              adjustsFontSizeToFit={false}
            >
              {result.title}
            </Text>
            <Text 
              style={styles.webResultSnippet}
              allowFontScaling={false}
              adjustsFontSizeToFit={false}
            >
              {result.snippet}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageWrapper,
        item.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper,
      ]}
    >
      <View style={styles.avatarContainer}>
        {item.sender === 'user' ? (
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        ) : (
          <View style={styles.botAvatar}>
            <Text style={styles.avatarText}>G</Text>
          </View>
        )}
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageTextContainer}>
          <Text 
            style={[
              styles.messageText,
              item.sender === 'user' ? styles.userMessageText : styles.botMessageText
            ]}
            numberOfLines={0}
            textBreakStrategy="simple"
            allowFontScaling={false}
            adjustsFontSizeToFit={false}
          >
            {item.text}
          </Text>
        </View>
        {item.sender === 'bot' && renderWebResults(item.webResults)}
        <Text 
          style={styles.timestamp}
          allowFontScaling={false}
          adjustsFontSizeToFit={false}
        >
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Gym Assistant</Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Ask me anything about the gym facilities, hours, or programs!
              </Text>
            </View>
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about gym facilities, hours, or programs..."
            placeholderTextColor={COLORS.textPrimary + '80'}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || inputText.trim() === ''}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Ionicons name="send" size={24} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

ChatbotTab.propTypes = {
  messages: PropTypes.arrayOf(Message),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 60,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '40',
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  resetButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: width * 0.85,
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  botMessageWrapper: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    minWidth: 10,
    width: width * 0.7,
  },
  messageTextContainer: {
    minWidth: 10,
    width: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textPrimary,
    flexShrink: 1,
    flexWrap: 'wrap',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textPrimary + '60',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '40',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.secondary + '20',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    color: COLORS.textPrimary,
    minHeight: 44,
    includeFontPadding: false,
    textAlignVertical: 'center',
    allowFontScaling: false,
    adjustsFontSizeToFit: false,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.primary + '60',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textPrimary + '80',
    textAlign: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  webResultsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
  },
  webResultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    includeFontPadding: false,
  },
  webResultItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
  webResultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    includeFontPadding: false,
  },
  webResultSnippet: {
    fontSize: 12,
    color: COLORS.textPrimary + '80',
    lineHeight: 16,
    includeFontPadding: false,
  },
}); 