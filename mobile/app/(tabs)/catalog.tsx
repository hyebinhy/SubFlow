import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import { ServiceLogo } from '../../src/components/ServiceLogo';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../src/constants/theme';

interface Category {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: Category[] = [
  { name: 'All', icon: 'apps', color: Colors.primary },
  { name: 'Entertainment', icon: 'tv', color: '#E50914' },
  { name: 'Music', icon: 'musical-notes', color: '#1DB954' },
  { name: 'Developer Tools', icon: 'code-slash', color: '#24292E' },
  { name: 'Cloud/Infrastructure', icon: 'cloud', color: '#FF9900' },
  { name: 'Productivity', icon: 'briefcase', color: '#D83B01' },
  { name: 'Education', icon: 'school', color: '#0056D2' },
  { name: 'Gaming', icon: 'game-controller', color: '#107C10' },
  { name: 'Health & Fitness', icon: 'fitness', color: '#FC4C02' },
  { name: 'News & Media', icon: 'newspaper', color: '#000000' },
  { name: 'Storage', icon: 'folder', color: '#3693F5' },
  { name: 'Security & VPN', icon: 'shield-checkmark', color: '#4687FF' },
  { name: 'Lifestyle', icon: 'heart', color: '#03C75A' },
];

interface Plan {
  name: string;
  price: string;
}

interface Service {
  name: string;
  category: string;
  priceRange: string;
  description: string;
  website?: string;
  plans?: Plan[];
}

const ALL_SERVICES: Service[] = [
  // Entertainment
  { name: 'Netflix', category: 'Entertainment', priceRange: '₩5,500~₩17,000', description: 'Movies, Series, Docs', website: 'https://www.netflix.com', plans: [{ name: 'Ad-supported', price: '₩5,500/mo' }, { name: 'Standard', price: '₩13,500/mo' }, { name: 'Premium', price: '₩17,000/mo' }] },
  { name: 'YouTube Premium', category: 'Entertainment', priceRange: '₩10,450~₩16,900', description: 'Ad-free YT + Music' },
  { name: 'Disney+', category: 'Entertainment', priceRange: '₩9,900~₩13,900', description: 'Disney, Marvel, Star Wars' },
  { name: 'Wavve', category: 'Entertainment', priceRange: '₩7,900~₩13,900', description: 'Korean VOD' },
  { name: 'Tving', category: 'Entertainment', priceRange: '₩7,900~₩13,900', description: 'Original Content' },
  { name: 'Watcha', category: 'Entertainment', priceRange: '₩7,900~₩12,900', description: 'Movie Streaming' },
  { name: 'Apple TV+', category: 'Entertainment', priceRange: '₩6,500', description: 'Apple Originals' },
  { name: 'Coupang Play', category: 'Entertainment', priceRange: '₩4,990', description: 'Coupang Streaming' },
  { name: 'Amazon Prime Video', category: 'Entertainment', priceRange: '₩5,900', description: 'Amazon Originals' },
  { name: 'Laftel', category: 'Entertainment', priceRange: '₩5,900~₩9,900', description: 'Anime Streaming' },
  { name: 'Paramount+', category: 'Entertainment', priceRange: '₩7,900', description: 'CBS, Paramount' },
  // Music
  { name: 'Spotify', category: 'Music', priceRange: '₩10,900', description: 'Global Music Streaming' },
  { name: 'Apple Music', category: 'Music', priceRange: '₩10,900', description: 'Lossless Audio' },
  { name: 'Melon', category: 'Music', priceRange: '₩10,900', description: '#1 Korean Music' },
  { name: 'Genie Music', category: 'Music', priceRange: '₩8,500', description: 'KT Music Service' },
  { name: 'FLO', category: 'Music', priceRange: '₩8,000', description: 'SKT Music Service' },
  { name: 'YouTube Music', category: 'Music', priceRange: '₩10,450', description: 'YouTube-based Music' },
  { name: 'VIBE', category: 'Music', priceRange: '₩8,900', description: 'Naver Music' },
  { name: 'Bugs', category: 'Music', priceRange: '₩7,900', description: 'Hi-Fi Music' },
  { name: 'Tidal', category: 'Music', priceRange: '₩10,900', description: 'HiFi Streaming' },
  // Developer Tools
  { name: 'GitHub Copilot', category: 'Developer Tools', priceRange: '$10~$39/mo', description: 'AI Coding Assistant' },
  { name: 'JetBrains All Products', category: 'Developer Tools', priceRange: '$28.90/mo', description: 'IntelliJ, WebStorm' },
  { name: 'ChatGPT Plus', category: 'Developer Tools', priceRange: '$20/mo', description: 'OpenAI GPT-4' },
  { name: 'Claude Pro', category: 'Developer Tools', priceRange: '$20/mo', description: 'Anthropic Claude' },
  { name: 'Notion', category: 'Developer Tools', priceRange: '$8~$15/mo', description: 'All-in-one Workspace' },
  { name: 'Figma', category: 'Developer Tools', priceRange: '$12~$75/mo', description: 'Design & Prototype' },
  { name: 'Cursor', category: 'Developer Tools', priceRange: '$20/mo', description: 'AI Code Editor' },
  { name: 'Midjourney', category: 'Developer Tools', priceRange: '$10~$60/mo', description: 'AI Image Generation' },
  { name: 'Perplexity Pro', category: 'Developer Tools', priceRange: '$20/mo', description: 'AI Search Engine' },
  { name: 'GitLab', category: 'Developer Tools', priceRange: '$29/mo', description: 'DevOps Platform' },
  { name: 'Replit', category: 'Developer Tools', priceRange: '$25/mo', description: 'Cloud IDE' },
  // Cloud/Infrastructure
  { name: 'Vercel', category: 'Cloud/Infrastructure', priceRange: '$20/mo~', description: 'Frontend Deploy' },
  { name: 'Netlify', category: 'Cloud/Infrastructure', priceRange: '$19/mo~', description: 'Static Hosting' },
  { name: 'AWS', category: 'Cloud/Infrastructure', priceRange: 'Pay-as-you-go', description: 'Amazon Cloud' },
  { name: 'DigitalOcean', category: 'Cloud/Infrastructure', priceRange: '$4/mo~', description: 'Cloud Servers' },
  { name: 'Cloudflare', category: 'Cloud/Infrastructure', priceRange: '$20/mo~', description: 'CDN / Security' },
  // Productivity
  { name: 'Microsoft 365', category: 'Productivity', priceRange: '₩8,900/mo', description: 'Office + OneDrive' },
  { name: 'Google One', category: 'Productivity', priceRange: '₩2,400~₩29,900', description: 'Google Storage' },
  { name: 'Dropbox', category: 'Productivity', priceRange: '$11.99/mo', description: 'Cloud Storage' },
  { name: 'Adobe Creative Cloud', category: 'Productivity', priceRange: '₩11,000~₩86,900', description: 'Photoshop, Illustrator' },
  { name: 'Slack', category: 'Productivity', priceRange: '$7.25/mo', description: 'Team Messaging' },
  { name: 'Zoom', category: 'Productivity', priceRange: '$13.33/mo', description: 'Video Conferencing' },
  { name: 'Canva Pro', category: 'Productivity', priceRange: '₩14,900/mo', description: 'Design Tool' },
  { name: 'Todoist', category: 'Productivity', priceRange: '$4/mo', description: 'Task Management' },
  { name: 'Grammarly', category: 'Productivity', priceRange: '$12/mo', description: 'Grammar Checker' },
  { name: 'Miro', category: 'Productivity', priceRange: '$8/mo', description: 'Online Whiteboard' },
  { name: 'Linear', category: 'Productivity', priceRange: '$8/mo', description: 'Issue Tracker' },
  // Education
  { name: 'Duolingo Plus', category: 'Education', priceRange: '₩13,400/mo', description: 'Language Learning' },
  { name: 'LinkedIn Premium', category: 'Education', priceRange: '$29.99/mo', description: 'Career Network' },
  { name: 'Coursera Plus', category: 'Education', priceRange: '$59/mo', description: 'Online Courses' },
  { name: 'Class101', category: 'Education', priceRange: '₩17,900/mo', description: 'Creator Classes' },
  { name: '인프런', category: 'Education', priceRange: '₩25,000/mo', description: 'IT / Programming' },
  { name: '밀리의 서재', category: 'Education', priceRange: '₩9,900/mo', description: 'E-book Subscription' },
  { name: '리디 셀렉트', category: 'Education', priceRange: '₩6,500/mo', description: 'E-book / Web Novel' },
  // Gaming
  { name: 'Nintendo Switch Online', category: 'Gaming', priceRange: '₩3,900/mo', description: 'Nintendo Online' },
  { name: 'PlayStation Plus', category: 'Gaming', priceRange: '₩6,800/mo', description: 'PS Online + Games' },
  { name: 'Xbox Game Pass', category: 'Gaming', priceRange: '₩10,900/mo', description: 'Game Subscription' },
  { name: 'Discord Nitro', category: 'Gaming', priceRange: '$9.99/mo', description: 'HD Stream, Emoji' },
  { name: 'EA Play', category: 'Gaming', priceRange: '$4.99/mo', description: 'EA Game Library' },
  { name: 'Steam', category: 'Gaming', priceRange: 'Free~', description: 'PC Game Platform' },
  // Health & Fitness
  { name: 'Calm', category: 'Health & Fitness', priceRange: '$14.99/mo', description: 'Meditation / Sleep' },
  { name: 'Headspace', category: 'Health & Fitness', priceRange: '$12.99/mo', description: 'Meditation Guide' },
  { name: 'Strava', category: 'Health & Fitness', priceRange: '$11.99/mo', description: 'Run / Cycle Tracker' },
  { name: 'Nike Run Club+', category: 'Health & Fitness', priceRange: 'Free', description: 'Running App' },
  { name: 'FatSecret Premium', category: 'Health & Fitness', priceRange: '$6.99/mo', description: 'Diet / Calorie' },
  // News & Media
  { name: 'The New York Times', category: 'News & Media', priceRange: '$4/mo~', description: 'Global News' },
  { name: 'Medium', category: 'News & Media', priceRange: '$5/mo', description: 'Article Platform' },
  { name: 'The Economist', category: 'News & Media', priceRange: '$20/mo', description: 'Business Magazine' },
  { name: '조선일보 디지털', category: 'News & Media', priceRange: '₩9,900/mo', description: 'Korean News' },
  { name: '중앙일보 디지털', category: 'News & Media', priceRange: '₩9,900/mo', description: 'Korean News' },
  // Storage
  { name: 'iCloud+', category: 'Storage', priceRange: '₩1,100~₩12,900', description: 'Apple Cloud' },
  { name: 'pCloud', category: 'Storage', priceRange: '$4.99/mo', description: 'Cloud Storage' },
  { name: 'MEGA', category: 'Storage', priceRange: '$5.49/mo', description: 'Encrypted Storage' },
  // Security & VPN
  { name: 'NordVPN', category: 'Security & VPN', priceRange: '$3.09/mo', description: 'VPN Service' },
  { name: 'ExpressVPN', category: 'Security & VPN', priceRange: '$6.67/mo', description: 'Fast VPN' },
  { name: 'Surfshark', category: 'Security & VPN', priceRange: '$2.49/mo', description: 'Budget VPN' },
  { name: '1Password', category: 'Security & VPN', priceRange: '$2.99/mo', description: 'Password Manager' },
  { name: 'Bitwarden', category: 'Security & VPN', priceRange: '$1/mo', description: 'Open-source Passwords' },
  // Lifestyle
  { name: '쿠팡 로켓와우', category: 'Lifestyle', priceRange: '₩4,990/mo', description: 'Free Delivery' },
  { name: '네이버 플러스 멤버십', category: 'Lifestyle', priceRange: '₩4,900/mo', description: 'Naver Pay Rewards' },
  { name: '배민클럽', category: 'Lifestyle', priceRange: '₩3,900/mo', description: 'Delivery Discount' },
  { name: '카카오톡 이모티콘 플러스', category: 'Lifestyle', priceRange: '₩4,900/mo', description: 'Unlimited Emoticons' },
  { name: 'Amazon Prime', category: 'Lifestyle', priceRange: '$14.99/mo', description: 'Free Shipping + Video' },
];

export default function CatalogScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openModal = (service: Service) => {
    setSelectedService(service);
    setModalVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(600);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedService(null);
    });
  };

  const filtered = ALL_SERVICES.filter((s) => {
    const matchCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchSearch = searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* 헤더 */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.logoMark}>
                <Ionicons name="contract" size={20} color={Colors.textWhite} />
                </View>
                <Text style={styles.headerTitle}>SubFlow</Text>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/settings')}>
                <Ionicons name="notifications-outline" size={20} color={Colors.textWhite} />
                </TouchableOpacity>
                <View style={styles.headerAvatar}>
                   <Ionicons name="person" size={16} color={Colors.primary} />
                </View>
            </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 타이틀 및 검색 바 */}
          <View style={styles.pageHeader}>
             <Text style={styles.subTitle}>{t('catalog.subtitle')}</Text>
             <Text style={styles.mainTitle}>{t('catalog.title')}</Text>

             <View style={styles.searchPill}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Find your subscriptions..."
                  placeholderTextColor={Colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                )}
             </View>
          </View>

          {/* 카테고리 필터 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
             {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.categoryPill, selectedCategory === cat.name && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat.name)}
                >
                  <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.name ? Colors.textPrimary : Colors.textWhite} />
                  <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
             ))}
          </ScrollView>

          {/* 서비스 카드 그리드 */}
          <View style={styles.gridContainer}>
             <View style={styles.mainWhiteCard}>
                <View style={styles.cardHeaderRow}>
                   <Text style={styles.cardTitle}>
                     {selectedCategory === 'All' ? 'All Services' : selectedCategory}
                   </Text>
                   <Text style={styles.countText}>{filtered.length} services</Text>
                </View>

                {filtered.length > 0 ? (
                  <View style={styles.grid}>
                     {filtered.map((service, i) => (
                        <TouchableOpacity key={i} style={styles.serviceCard} onPress={() => openModal(service)}>
                           <View style={styles.serviceCardTop}>
                              <ServiceLogo name={service.name} size={48} />
                              <TouchableOpacity style={styles.addBtnSmall}>
                                 <Ionicons name="add" size={16} color={Colors.textPrimary} />
                              </TouchableOpacity>
                           </View>
                           <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                           <Text style={styles.serviceDesc} numberOfLines={1}>{service.description}</Text>
                           <Text style={styles.servicePrice}>{service.priceRange}</Text>
                        </TouchableOpacity>
                     ))}
                  </View>
                ) : (
                  <View style={styles.empty}>
                    <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                )}
             </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── 서비스 상세 모달 (배경 fade + 시트 slide) ── */}
      {modalVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
          {/* 어두운 배경 (fade) */}
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          </Animated.View>

          {/* 시트 (slide up) */}
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            {selectedService && (
              <>
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <ServiceLogo name={selectedService.name} size={56} />
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalName}>{selectedService.name}</Text>
                    <Text style={styles.modalDesc}>{selectedService.description}</Text>
                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>{selectedService.category}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalPriceRow}>
                  <Ionicons name="pricetag" size={16} color={Colors.success} />
                  <Text style={styles.modalPriceLabel}>Price Range</Text>
                  <Text style={styles.modalPriceValue}>{selectedService.priceRange}</Text>
                </View>

                {selectedService.plans && selectedService.plans.length > 0 && (
                  <View style={styles.modalPlansSection}>
                    <Text style={styles.modalSectionTitle}>Available Plans</Text>
                    {selectedService.plans.map((plan, i) => (
                      <View key={i} style={styles.modalPlanRow}>
                        <View style={styles.modalPlanDot} />
                        <Text style={styles.modalPlanName}>{plan.name}</Text>
                        <Text style={styles.modalPlanPrice}>{plan.price}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {selectedService.website && (
                  <TouchableOpacity
                    style={styles.modalWebBtn}
                    onPress={() => Linking.openURL(selectedService.website!)}
                  >
                    <Ionicons name="globe-outline" size={18} color={Colors.primary} />
                    <Text style={styles.modalWebText}>Visit Website</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.modalSubscribeBtn} onPress={closeModal}>
                  <Ionicons name="add-circle" size={20} color="#FFF" />
                  <Text style={styles.modalSubscribeBtnText}>Add Subscription</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textWhite },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  pageHeader: { paddingHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  subTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium, marginBottom: 4 },
  mainTitle: { fontSize: 42, fontWeight: FontWeight.heavy, color: '#FFF', letterSpacing: -1 },
  searchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, marginTop: Spacing.lg, ...Shadow.sm
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  categoryScroll: { paddingHorizontal: Spacing.sm, gap: Spacing.sm, marginBottom: Spacing.xl },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  categoryPillActive: { backgroundColor: '#FFF', borderColor: '#FFF' },
  categoryText: { fontSize: FontSize.xs, color: '#FFF', fontWeight: FontWeight.semibold },
  categoryTextActive: { color: Colors.textPrimary },
  gridContainer: { marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  mainWhiteCard: {
    backgroundColor: '#FFF', borderRadius: 40, padding: Spacing.xxl, ...Shadow.md, minHeight: 400
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  countText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  serviceCard: {
    width: '46%', backgroundColor: Colors.surfaceLight, borderRadius: 32, padding: Spacing.lg, gap: 4,
    borderWidth: 1, borderColor: Colors.borderLight
  },
  serviceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  serviceName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  serviceDesc: { fontSize: 10, color: Colors.textTertiary },
  servicePrice: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold, marginTop: 2 },
  addBtnSmall: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center'
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary },
  // ── Modal ──
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xxl, paddingBottom: 100, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight,
    alignSelf: 'center', marginTop: 12, marginBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xl,
  },
  modalHeaderInfo: { flex: 1 },
  modalName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalDesc: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  modalCategoryBadge: {
    backgroundColor: Colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start', marginTop: 6,
  },
  modalCategoryText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.semibold },
  modalPriceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceLight, padding: 14, borderRadius: 16, marginBottom: Spacing.lg,
  },
  modalPriceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  modalPriceValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.success },
  modalPlansSection: { marginBottom: Spacing.lg },
  modalSectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  modalPlanRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  modalPlanDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginRight: Spacing.md },
  modalPlanName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  modalPlanPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalWebBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, marginBottom: Spacing.lg,
  },
  modalWebText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  modalSubscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, height: 52, borderRadius: 16, ...Shadow.sm,
  },
  modalSubscribeBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFF' },
});
