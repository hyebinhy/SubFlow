import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  { name: '전체', icon: 'apps', color: Colors.primary },
  { name: 'Entertainment', icon: 'tv', color: '#E50914' },
  { name: 'Music', icon: 'musical-notes', color: '#1DB954' },
  { name: 'Developer Tools', icon: 'code-slash', color: '#24292E' },
  { name: 'Cloud', icon: 'cloud', color: '#FF9900' },
  { name: 'Productivity', icon: 'briefcase', color: '#D83B01' },
];

const ALL_SERVICES = [
  { name: 'Netflix', category: 'Entertainment', priceRange: '₩5,500~₩17,000', description: 'Movies, Series, Docs' },
  { name: 'YouTube Premium', category: 'Entertainment', priceRange: '₩10,450~₩16,900', description: 'Ad-free YT + Music' },
  { name: 'Spotify', category: 'Music', priceRange: '₩10,900', description: 'Global Music Streaming' },
  { name: 'Disney+', category: 'Entertainment', priceRange: '₩9,900~₩13,900', description: 'Disney, Marvel, Star Wars' },
  { name: 'ChatGPT Plus', category: 'Developer Tools', priceRange: '$20/mo', description: 'OpenAI GPT-4' },
  { name: 'iCloud+', category: 'Cloud', priceRange: '₩1,100~', description: 'Apple Cloud Storage' },
];

export default function CatalogScreen() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* 헤더 */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.logoMark}>
                <Ionicons name="contract" size={20} color={Colors.textWhite} />
                </View>
                <Text style={styles.headerTitle}>Clerio</Text>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerIconBtn}>
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
             <Text style={styles.subTitle}>Service Catalog</Text>
             <Text style={styles.mainTitle}>Explore Hub</Text>
             
             {/* 레퍼런스 스타일 알약 검색창 */}
             <View style={styles.searchPill}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Find your subscriptions..."
                  placeholderTextColor={Colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
             </View>
          </View>

          {/* 카테고리 알약 필터 */}
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

          {/* 서비스 카드 그리드 (메인 화이트 카드 위) */}
          <View style={styles.gridContainer}>
             <View style={styles.mainWhiteCard}>
                <View style={styles.cardHeaderRow}>
                   <Text style={styles.cardTitle}>Recommended</Text>
                   <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>

                <View style={styles.grid}>
                   {ALL_SERVICES.map((service, i) => (
                      <TouchableOpacity key={i} style={styles.serviceCard}>
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
             </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
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
  seeAll: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  serviceCard: {
    width: '46%', backgroundColor: Colors.surfaceLight, borderRadius: 32, padding: Spacing.lg, gap: 4,
    borderWidth: 1, borderColor: Colors.borderLight
  },
  serviceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  serviceName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  serviceDesc: { fontSize: 10, color: Colors.textTertiary },
  servicePrice: { fontSize: 11, fontWeight: FontWeight.heavy, color: Colors.success, marginTop: 4 },
  addBtnSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...Shadow.sm }
});
