import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  ScrollView,
  Appearance,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Circle } from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

const { width, height } = Dimensions.get('window');

i18n.init({
  resources: {
    en: {
      translation: {
        title: 'My Zikrs',
        addZikr: 'Add New Zikr',
        editZikr: 'Edit Zikr',
        zikrName: 'Zikr Name',
        target: 'Target (or "unlimited")',
        update: 'Update',
        cancel: 'Cancel',
        delete: 'Delete',
        reset: 'Reset',
        back: 'Back',
        count: 'Count',
        reminder: 'Set Reminder',
        confirmDelete: 'Are you sure you want to delete this Zikr?',
        error: 'Error',
        zikrNameRequired: 'Zikr name is required',
        targetRequired: 'Target is required',
        invalidTarget: 'Please enter a valid number or "unlimited"',
        confirmReset: 'Are you sure you want to reset the counter?',
        statistics: 'Statistics',
        todayCount: "Today's Count",
        totalCount: 'Total Count',
        bestStreak: 'Best Streak',
      },
    },
    ur: {
      translation: {
        title: 'میرے اذکار',
        addZikr: 'نیا ذکر شامل کریں',
        editZikr: 'ذکر میں ترمیم کریں',
        zikrName: 'ذکر کا نام',
        target: 'ہدف (یا "unlimited")',
        update: 'اپ ڈیٹ کریں',
        cancel: 'منسوخ کریں',
        delete: 'حذف کریں',
        reset: 'ری سیٹ کریں',
        back: 'واپس جائیں',
        count: 'گنتی',
        reminder: 'یاد دہانی سیٹ کریں',
        confirmDelete: 'کیا آپ واقعی اس ذکر کو حذف کرنا چاہتے ہیں؟',
        error: 'خرابی',
        zikrNameRequired: 'ذکر کا نام درکار ہے',
        targetRequired: 'ہدف درکار ہے',
        invalidTarget: 'براہ کرم درست نمبر یا "unlimited" درج کریں',
        confirmReset: 'کیا آپ واقعی کاؤنٹر کو دوبارہ ترتیب دینا چاہتے ہیں؟',
        statistics: 'اعدادوشمار',
        todayCount: 'آج کی گنتی',
        totalCount: 'کل گنتی',
        bestStreak: 'بہترین سلسلہ',
      },
    },
  },
  lng: 'en',
  fallbackLng: 'en',
});

export default function App() {
  const { t } = useTranslation();
  const [zikrs, setZikrs] = useState([]);
  const [selectedZikr, setSelectedZikr] = useState(null);
  const [count, setCount] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [zikrName, setZikrName] = useState('');
  const [zikrTarget, setZikrTarget] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editZikrId, setEditZikrId] = useState(null);
  const [theme, setTheme] = useState(Appearance.getColorScheme() || 'light');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [language, setLanguage] = useState('en');
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    loadZikrs();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const loadZikrs = async () => {
    try {
      const savedZikrs = await AsyncStorage.getItem('zikrs');
      const savedStats = await AsyncStorage.getItem('statistics');
      
      if (savedZikrs) setZikrs(JSON.parse(savedZikrs));
      if (savedStats) setStatistics(JSON.parse(savedStats));
    } catch (error) {
      Alert.alert(t('error'), 'Failed to load data');
      console.error('Failed to load data:', error);
    }
  };

  const saveZikrs = async (updatedZikrs) => {
    try {
      await AsyncStorage.setItem('zikrs', JSON.stringify(updatedZikrs));
    } catch (error) {
      console.error('Failed to save Zikrs', error);
    }
  };

  const handleAddZikr = () => {
    if (!zikrName.trim()) {
      Alert.alert(t('error'), t('zikrNameRequired'));
      return;
    }

    if (!zikrTarget.trim()) {
      Alert.alert(t('error'), t('targetRequired'));
      return;
    }

    if (zikrTarget !== 'unlimited' && isNaN(parseInt(zikrTarget, 10))) {
      Alert.alert(t('error'), t('invalidTarget'));
      return;
    }

    const newZikr = {
      id: Date.now().toString(),
      name: zikrName,
      target: zikrTarget === 'unlimited' ? Infinity : parseInt(zikrTarget, 10),
      count: 0,
      history: [],
    };

    const updatedZikrs = [...zikrs, newZikr];
    setZikrs(updatedZikrs);
    saveZikrs(updatedZikrs);
    setIsFormVisible(false);
    setZikrName('');
    setZikrTarget('');
  };

  const handleEditZikr = (zikr) => {
    setZikrName(zikr.name);
    setZikrTarget(zikr.target === Infinity ? 'unlimited' : zikr.target.toString());
    setIsEditMode(true);
    setEditZikrId(zikr.id);
    setIsFormVisible(true);
  };

  const handleUpdateZikr = () => {
    const updatedZikrs = zikrs.map((zikr) =>
      zikr.id === editZikrId
        ? {
            ...zikr,
            name: zikrName,
            target: zikrTarget === 'unlimited' ? Infinity : parseInt(zikrTarget, 10),
          }
        : zikr
    );
    setZikrs(updatedZikrs);
    saveZikrs(updatedZikrs);
    setIsFormVisible(false);
    setZikrName('');
    setZikrTarget('');
    setIsEditMode(false);
    setEditZikrId(null);
  };

  const handleDeleteZikr = (zikrId) => {
    Alert.alert(t('confirmDelete'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), onPress: () => confirmDelete(zikrId) },
    ]);
  };

  const confirmDelete = (zikrId) => {
    const updatedZikrs = zikrs.filter((zikr) => zikr.id !== zikrId);
    setZikrs(updatedZikrs);
    saveZikrs(updatedZikrs);
  };

  const handleCount = async () => {
    if (selectedZikr.target === Infinity || count < selectedZikr.target) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        const newCount = count + 1;
        setCount(newCount);
        
        const today = new Date().toISOString().split('T')[0];
        const updatedStats = {
          ...statistics,
          [selectedZikr.id]: {
            ...statistics[selectedZikr.id],
            totalCount: (statistics[selectedZikr.id]?.totalCount || 0) + 1,
            [today]: (statistics[selectedZikr.id]?.[today] || 0) + 1,
          },
        };
        
        setStatistics(updatedStats);
        await AsyncStorage.setItem('statistics', JSON.stringify(updatedStats));

        const updatedZikrs = zikrs.map((zikr) =>
          zikr.id === selectedZikr.id ? { ...zikr, count: zikr.count + 1 } : zikr
        );
        setZikrs(updatedZikrs);
        await AsyncStorage.setItem('zikrs', JSON.stringify(updatedZikrs));
      } catch (error) {
        console.error('Error updating count:', error);
      }
    }
  };

  const handleReset = () => {
    Alert.alert(t('confirmReset'), t('confirmReset'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('reset'),
        style: 'destructive',
        onPress: async () => {
          try {
            setCount(0);
            const updatedZikrs = zikrs.map((zikr) =>
              zikr.id === selectedZikr.id ? { ...zikr, count: 0 } : zikr
            );
            setZikrs(updatedZikrs);
            await AsyncStorage.setItem('zikrs', JSON.stringify(updatedZikrs));
          } catch (error) {
            console.error('Error resetting count:', error);
          }
        },
      },
    ]);
  };

  const handleSelectZikr = (zikr) => {
    setSelectedZikr(zikr);
    setCount(zikr.count);
  };

  const handleBack = () => {
    setSelectedZikr(null);
    setCount(0);
  };

  const handleSetReminder = (event, selectedDate) => {
    setShowReminderPicker(false);
    if (selectedDate) {
      setReminderTime(selectedDate);
      // Schedule reminder logic here
    }
  };

  const progress = selectedZikr?.target === Infinity ? 0 : count / selectedZikr?.target;

  const styles = getStyles(theme);

  const renderStatistics = () => {
    if (!selectedZikr) return null;

    const stats = statistics[selectedZikr.id] || {};
    const today = new Date().toISOString().split('T')[0];

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.statisticsTitle}>{t('statistics')}</Text>
        <Text style={styles.statisticsText}>
          {t('todayCount')}: {stats[today] || 0}
        </Text>
        <Text style={styles.statisticsText}>
          {t('totalCount')}: {stats.totalCount || 0}
        </Text>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {selectedZikr ? (
          <Animatable.View animation="fadeIn" style={styles.counterContainer}>
            <Text style={styles.title}>{selectedZikr.name}</Text>
            <Circle
              progress={progress}
              size={width * 0.7}
              showsText
              textStyle={styles.progressText}
              color={theme === 'light' ? '#4CAF50' : '#81C784'}
            />
            <Text style={styles.countText}>{count}</Text>
            <TouchableOpacity style={styles.button} onPress={handleCount}>
              <Text style={styles.buttonText}>{t('count')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>{t('reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>{t('back')}</Text>
            </TouchableOpacity>
          </Animatable.View>
        ) : (
          <ScrollView style={styles.zikrListContainer}>
            <Text style={styles.title}>{t('title')}</Text>
            {zikrs.map((zikr) => (
              <Animatable.View
                key={zikr.id}
                animation="fadeInUp"
                style={styles.zikrItem}
              >
                <TouchableOpacity onPress={() => handleSelectZikr(zikr)}>
                  <Text style={styles.zikrName}>{zikr.name}</Text>
                  <Text style={styles.zikrCount}>{zikr.count}</Text>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEditZikr(zikr)}>
                    <Icon name="edit" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteZikr(zikr.id)}>
                    <Icon name="delete" size={24} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={() => setIsFormVisible(true)}>
              <Text style={styles.addButtonText}>{t('addZikr')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <Modal visible={isFormVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{isEditMode ? t('editZikr') : t('addZikr')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('zikrName')}
                value={zikrName}
                onChangeText={setZikrName}
              />
              <TextInput
                style={styles.input}
                placeholder={t('target')}
                value={zikrTarget}
                onChangeText={setZikrTarget}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={isEditMode ? handleUpdateZikr : handleAddZikr}
              >
                <Text style={styles.modalButtonText}>{isEditMode ? t('update') : t('addZikr')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setIsFormVisible(false)}>
                <Text style={styles.modalButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {showReminderPicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleSetReminder}
          />
        )}

        {selectedZikr && renderStatistics()}
      </View>
    </GestureHandlerRootView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#121212',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: theme === 'light' ? '#000' : '#fff',
      textAlign: 'right',
    },
    countText: {
      fontSize: 48,
      fontWeight: 'bold',
      marginVertical: 20,
      color: theme === 'light' ? '#000' : '#fff',
      textAlign: 'right',
    },
    button: {
      backgroundColor: theme === 'light' ? '#4CAF50' : '#81C784',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginVertical: 10,
    },
    buttonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    resetButton: {
      backgroundColor: theme === 'light' ? '#f44336' : '#E57373',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginVertical: 10,
    },
    resetButtonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    backButton: {
      backgroundColor: theme === 'light' ? '#2196F3' : '#64B5F6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginVertical: 10,
    },
    backButtonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    zikrListContainer: {
      flex: 1,
    },
    zikrItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      marginVertical: 10,
      backgroundColor: theme === 'light' ? '#f9f9f9' : '#1E1E1E',
      borderRadius: 10,
      elevation: 3,
    },
    zikrName: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'right',
      color: theme === 'light' ? '#000' : '#fff',
    },
    zikrCount: {
      fontSize: 18,
      color: theme === 'light' ? '#4CAF50' : '#81C784',
      textAlign: 'right',
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    addButton: {
      backgroundColor: theme === 'light' ? '#2196F3' : '#64B5F6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginVertical: 20,
    },
    addButtonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: width * 0.8,
      padding: 20,
      backgroundColor: theme === 'light' ? '#fff' : '#1E1E1E',
      borderRadius: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'right',
      color: theme === 'light' ? '#000' : '#fff',
    },
    input: {
      borderWidth: 1,
      borderColor: theme === 'light' ? '#ccc' : '#333',
      borderRadius: 5,
      padding: 10,
      marginVertical: 10,
      textAlign: 'right',
      color: theme === 'light' ? '#000' : '#fff',
    },
    modalButton: {
      backgroundColor: theme === 'light' ? '#4CAF50' : '#81C784',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginVertical: 10,
    },
    modalButtonText: {
      fontSize: 18,
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    statisticsContainer: {
      padding: 15,
      marginVertical: 10,
      backgroundColor: theme === 'light' ? '#f9f9f9' : '#1E1E1E',
      borderRadius: 10,
      elevation: 3,
    },
    statisticsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme === 'light' ? '#000' : '#fff',
      textAlign: 'right',
    },
    statisticsText: {
      fontSize: 16,
      color: theme === 'light' ? '#000' : '#fff',
      textAlign: 'right',
      marginVertical: 5,
    },
  });