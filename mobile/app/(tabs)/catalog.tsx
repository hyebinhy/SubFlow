import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import { subscriptionAPI } from '../../src/services/api';
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
  cycle?: 'mo' | 'yr' | 'none'; // mo=월간, yr=연간, none=단위없음
}

interface Service {
  name: string;
  category: string;
  priceRange: string;
  description: string;
  website?: string;
  plans?: Plan[];
}

// 가격 + 주기를 언어에 맞게 포맷
function formatPlanPrice(price: string, cycle: 'mo' | 'yr' | 'none' | undefined, lang: string): string {
  // Free, Pay-as-you-go 등은 단위 없이 그대로
  if (price === 'Free' || price.includes('Pay-as') || price === '$0' || price === '₩0') return price;
  const c = cycle ?? 'mo'; // 기본값 월간
  if (c === 'none') return price;
  const suffix = c === 'mo'
    ? (lang === 'ko' ? '/월' : '/mo')
    : (lang === 'ko' ? '/연' : '/yr');
  return `${price}${suffix}`;
}

const ALL_SERVICES: Service[] = [
  // Entertainment
  { name: 'Netflix', category: 'Entertainment', priceRange: '₩5,500~₩17,000', description: 'Movies, Series, Docs', website: 'https://www.netflix.com', plans: [{ name: '광고형 스탠다드', price: '₩5,500' }, { name: '스탠다드', price: '₩13,500' }, { name: '프리미엄', price: '₩17,000' }] },
  { name: 'YouTube Premium', category: 'Entertainment', priceRange: '₩8,500~₩23,900', description: 'Ad-free YT + Music', website: 'https://www.youtube.com/premium', plans: [{ name: 'Lite', price: '₩8,500' }, { name: '개인', price: '₩14,900' }, { name: '가족', price: '₩23,900' }] },
  { name: 'Disney+', category: 'Entertainment', priceRange: '₩9,900~₩13,900', description: 'Disney, Marvel, Star Wars', website: 'https://www.disneyplus.com', plans: [{ name: '스탠다드', price: '₩9,900' }, { name: '프리미엄', price: '₩13,900' }] },
  { name: 'Wavve', category: 'Entertainment', priceRange: '₩7,900~₩13,900', description: 'Korean VOD', website: 'https://www.wavve.com', plans: [{ name: '베이직', price: '₩7,900' }, { name: '스탠다드', price: '₩10,900' }, { name: '프리미엄', price: '₩13,900' }] },
  { name: 'Tving', category: 'Entertainment', priceRange: '₩7,900~₩17,000', description: 'Original Content', website: 'https://www.tving.com', plans: [{ name: '광고형 스탠다드', price: '₩7,900' }, { name: '스탠다드', price: '₩10,900' }, { name: '프리미엄', price: '₩17,000' }] },
  { name: 'Watcha', category: 'Entertainment', priceRange: '₩7,900~₩12,900', description: 'Movie Streaming', website: 'https://www.watcha.com', plans: [{ name: '베이직', price: '₩7,900' }, { name: '프리미엄', price: '₩12,900' }] },
  { name: 'Apple TV+', category: 'Entertainment', priceRange: '₩6,500~₩22,900', description: 'Apple Originals', website: 'https://tv.apple.com', plans: [{ name: '개인', price: '₩6,500' }, { name: 'Apple One 개인', price: '₩12,900' }, { name: 'Apple One 가족', price: '₩22,900' }] },
  { name: 'Coupang Play', category: 'Entertainment', priceRange: '₩4,990', description: 'Coupang Streaming', website: 'https://www.coupangplay.com', plans: [{ name: '로켓와우 포함', price: '₩4,990' }] },
  { name: 'Amazon Prime Video', category: 'Entertainment', priceRange: '₩5,900', description: 'Amazon Originals', website: 'https://www.primevideo.com', plans: [{ name: '월간', price: '₩5,900' }] },
  { name: 'Laftel', category: 'Entertainment', priceRange: '₩5,900~₩9,900', description: 'Anime Streaming', website: 'https://www.laftel.net', plans: [{ name: '스탠다드', price: '₩5,900' }, { name: '프리미엄', price: '₩9,900' }] },
  { name: 'Paramount+', category: 'Entertainment', priceRange: '₩7,900', description: 'CBS, Paramount', plans: [{ name: '월간', price: '₩7,900' }] },
  // Music
  { name: 'Spotify', category: 'Music', priceRange: '₩5,900~₩16,900', description: 'Global Music Streaming', website: 'https://www.spotify.com', plans: [{ name: 'Student', price: '₩5,900' }, { name: 'Individual', price: '₩10,900' }, { name: 'Duo', price: '₩14,900' }, { name: 'Family (6인)', price: '₩16,900' }] },
  { name: 'Apple Music', category: 'Music', priceRange: '₩5,900~₩16,900', description: 'Lossless Audio', website: 'https://music.apple.com', plans: [{ name: 'Student', price: '₩5,900' }, { name: '개인', price: '₩10,900' }, { name: '가족 (6인)', price: '₩16,900' }] },
  { name: 'Melon', category: 'Music', priceRange: '₩7,900~₩10,900', description: '#1 Korean Music', website: 'https://www.melon.com', plans: [{ name: 'Essential', price: '₩7,900' }, { name: 'Premium', price: '₩10,900' }] },
  { name: 'Genie Music', category: 'Music', priceRange: '₩7,500~₩10,900', description: 'KT Music Service', website: 'https://www.genie.co.kr', plans: [{ name: 'Top100', price: '₩7,500' }, { name: '무제한 듣기', price: '₩8,500' }, { name: '무제한+오프라인', price: '₩10,900' }] },
  { name: 'FLO', category: 'Music', priceRange: '₩7,900~₩10,900', description: 'SKT Music Service', website: 'https://www.music-flo.com', plans: [{ name: '무제한 듣기', price: '₩7,900' }, { name: '무제한+저장', price: '₩10,900' }] },
  { name: 'YouTube Music', category: 'Music', priceRange: '₩8,500~₩14,900', description: 'YouTube-based Music', website: 'https://music.youtube.com', plans: [{ name: '개인', price: '₩8,500' }, { name: '가족', price: '₩14,900' }] },
  { name: 'VIBE', category: 'Music', priceRange: '₩7,900~₩10,900', description: 'Naver Music', website: 'https://vibe.naver.com', plans: [{ name: '스트리밍', price: '₩7,900' }, { name: '스트리밍+저장', price: '₩10,900' }] },
  { name: 'Bugs', category: 'Music', priceRange: '₩7,900~₩10,900', description: 'Hi-Fi Music', website: 'https://music.bugs.co.kr', plans: [{ name: '스트리밍', price: '₩7,900' }, { name: '스트리밍+저장', price: '₩10,900' }] },
  { name: 'Tidal', category: 'Music', priceRange: '$10.99~$19.99', description: 'HiFi Streaming', website: 'https://tidal.com', plans: [{ name: 'HiFi', price: '$10.99' }, { name: 'HiFi Plus', price: '$19.99' }] },
  // Developer Tools
  { name: 'GitHub Copilot', category: 'Developer Tools', priceRange: '$10~$39', description: 'AI Coding Assistant', website: 'https://github.com/features/copilot', plans: [{ name: 'Individual', price: '$10' }, { name: 'Business', price: '$19' }, { name: 'Enterprise', price: '$39' }] },
  { name: 'JetBrains All Products', category: 'Developer Tools', priceRange: '$16.90~$28.90', description: 'IntelliJ, WebStorm', website: 'https://www.jetbrains.com', plans: [{ name: '개별 IDE', price: '$16.90' }, { name: 'All Products Pack', price: '$28.90' }] },
  { name: 'ChatGPT Plus', category: 'Developer Tools', priceRange: '$0~$200', description: 'OpenAI GPT-4', website: 'https://chat.openai.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Plus', price: '$20' }, { name: 'Pro', price: '$200' }] },
  { name: 'Claude Pro', category: 'Developer Tools', priceRange: '$0~$200', description: 'Anthropic Claude', website: 'https://claude.ai', plans: [{ name: 'Free', price: '$0' }, { name: 'Pro', price: '$20' }, { name: 'Max (5x)', price: '$100' }, { name: 'Max (20x)', price: '$200' }] },
  { name: 'Notion', category: 'Developer Tools', priceRange: '$0~$15', description: 'All-in-one Workspace', website: 'https://www.notion.so', plans: [{ name: 'Free', price: '$0' }, { name: 'Plus', price: '$8' }, { name: 'Business', price: '$15' }] },
  { name: 'Figma', category: 'Developer Tools', priceRange: '$0~$75', description: 'Design & Prototype', website: 'https://www.figma.com', plans: [{ name: 'Starter (무료)', price: '$0' }, { name: 'Professional', price: '$12' }, { name: 'Organization', price: '$45' }, { name: 'Enterprise', price: '$75' }] },
  { name: 'Cursor', category: 'Developer Tools', priceRange: '$0~$40', description: 'AI Code Editor', website: 'https://cursor.sh', plans: [{ name: 'Hobby (무료)', price: '$0' }, { name: 'Pro', price: '$20' }, { name: 'Business', price: '$40' }] },
  { name: 'Midjourney', category: 'Developer Tools', priceRange: '$10~$120', description: 'AI Image Generation', website: 'https://www.midjourney.com', plans: [{ name: 'Basic', price: '$10' }, { name: 'Standard', price: '$30' }, { name: 'Pro', price: '$60' }, { name: 'Mega', price: '$120' }] },
  { name: 'Perplexity Pro', category: 'Developer Tools', priceRange: '$0~$20', description: 'AI Search Engine', website: 'https://www.perplexity.ai', plans: [{ name: 'Free', price: '$0' }, { name: 'Pro', price: '$20' }] },
  { name: 'GitLab', category: 'Developer Tools', priceRange: '$0~$99', description: 'DevOps Platform', website: 'https://about.gitlab.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Premium', price: '$29' }, { name: 'Ultimate', price: '$99' }] },
  { name: 'Replit', category: 'Developer Tools', priceRange: '$0~$25', description: 'Cloud IDE', website: 'https://replit.com', plans: [{ name: 'Starter (무료)', price: '$0' }, { name: 'Replit Core', price: '$25' }] },
  // Cloud/Infrastructure
  { name: 'Vercel', category: 'Cloud/Infrastructure', priceRange: '$0~$20', description: 'Frontend Deploy', website: 'https://vercel.com', plans: [{ name: 'Hobby (무료)', price: '$0' }, { name: 'Pro', price: '$20' }] },
  { name: 'Netlify', category: 'Cloud/Infrastructure', priceRange: '$0~$19', description: 'Static Hosting', website: 'https://www.netlify.com', plans: [{ name: 'Starter (무료)', price: '$0' }, { name: 'Pro', price: '$19' }] },
  { name: 'AWS', category: 'Cloud/Infrastructure', priceRange: 'Pay-as-you-go', description: 'Amazon Cloud', website: 'https://aws.amazon.com', plans: [{ name: 'Free Tier (12개월)', price: '$0' }, { name: '종량제', price: 'Pay-as-you-go' }] },
  { name: 'DigitalOcean', category: 'Cloud/Infrastructure', priceRange: '$4~$48', description: 'Cloud Servers', website: 'https://www.digitalocean.com', plans: [{ name: 'Basic Droplet', price: '$4' }, { name: 'General Purpose', price: '$12' }, { name: 'CPU-Optimized', price: '$48' }] },
  { name: 'Cloudflare', category: 'Cloud/Infrastructure', priceRange: '$0~$20', description: 'CDN / Security', website: 'https://www.cloudflare.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Pro', price: '$20' }] },
  // Productivity
  { name: 'Microsoft 365', category: 'Productivity', priceRange: '₩8,900~₩16,400', description: 'Office + OneDrive', website: 'https://www.microsoft.com/microsoft-365', plans: [{ name: 'Personal', price: '₩8,900' }, { name: 'Family (6인)', price: '₩12,900' }, { name: 'Business Basic', price: '₩16,400' }] },
  { name: 'Google One', category: 'Productivity', priceRange: '₩2,400~₩29,900', description: 'Google Storage', website: 'https://one.google.com', plans: [{ name: '100GB', price: '₩2,400' }, { name: '200GB', price: '₩3,700' }, { name: '2TB', price: '₩11,900' }, { name: '5TB', price: '₩29,900' }] },
  { name: 'Dropbox', category: 'Productivity', priceRange: '$9.99~$24', description: 'Cloud Storage', website: 'https://www.dropbox.com', plans: [{ name: 'Plus (2TB)', price: '$9.99' }, { name: 'Essentials (3TB)', price: '$18' }, { name: 'Business (9TB)', price: '$24' }] },
  { name: 'Adobe Creative Cloud', category: 'Productivity', priceRange: '₩11,000~₩86,900', description: 'Photoshop, Illustrator', website: 'https://www.adobe.com', plans: [{ name: 'Photography (PS+LR)', price: '₩11,000' }, { name: '단일 앱', price: '₩30,800' }, { name: 'All Apps', price: '₩86,900' }] },
  { name: 'Slack', category: 'Productivity', priceRange: '$0~$12.50', description: 'Team Messaging', website: 'https://slack.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Pro', price: '$7.25' }, { name: 'Business+', price: '$12.50' }] },
  { name: 'Zoom', category: 'Productivity', priceRange: '$0~$21.99', description: 'Video Conferencing', website: 'https://zoom.us', plans: [{ name: 'Basic (무료)', price: '$0' }, { name: 'Pro', price: '$13.33' }, { name: 'Business', price: '$21.99' }] },
  { name: 'Canva Pro', category: 'Productivity', priceRange: '₩0~₩14,900', description: 'Design Tool', website: 'https://www.canva.com', plans: [{ name: 'Free', price: '₩0' }, { name: 'Pro', price: '₩14,900' }] },
  { name: 'Todoist', category: 'Productivity', priceRange: '$0~$6', description: 'Task Management', website: 'https://todoist.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Pro', price: '$4' }, { name: 'Business', price: '$6' }] },
  { name: 'Grammarly', category: 'Productivity', priceRange: '$0~$15', description: 'Grammar Checker', website: 'https://www.grammarly.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Premium', price: '$12' }, { name: 'Business', price: '$15' }] },
  { name: 'Miro', category: 'Productivity', priceRange: '$0~$16', description: 'Online Whiteboard', website: 'https://miro.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Starter', price: '$8' }, { name: 'Business', price: '$16' }] },
  { name: 'Linear', category: 'Productivity', priceRange: '$0~$8', description: 'Issue Tracker', website: 'https://linear.app', plans: [{ name: 'Free', price: '$0' }, { name: 'Standard', price: '$8' }] },
  // Education
  { name: 'Duolingo Plus', category: 'Education', priceRange: '₩0~₩13,400', description: 'Language Learning', website: 'https://www.duolingo.com', plans: [{ name: '무료', price: '₩0' }, { name: 'Super', price: '₩13,400' }, { name: 'Family (6인)', price: '₩17,900' }] },
  { name: 'LinkedIn Premium', category: 'Education', priceRange: '$29.99~$59.99', description: 'Career Network', website: 'https://www.linkedin.com/premium', plans: [{ name: 'Career', price: '$29.99' }, { name: 'Business', price: '$59.99' }] },
  { name: 'Coursera Plus', category: 'Education', priceRange: '$49~$59', description: 'Online Courses', website: 'https://www.coursera.org', plans: [{ name: '단일 강좌', price: '$49' }, { name: 'Coursera Plus', price: '$59' }] },
  { name: 'Class101', category: 'Education', priceRange: '₩17,900~₩24,900', description: 'Creator Classes', website: 'https://class101.net', plans: [{ name: '연간 (월환산)', price: '₩17,900' }, { name: '월간', price: '₩24,900' }] },
  { name: '인프런', category: 'Education', priceRange: '₩0~₩25,000', description: 'IT / Programming', website: 'https://www.inflearn.com', plans: [{ name: '무료 강좌', price: '₩0' }, { name: 'Plus 멤버십', price: '₩25,000' }] },
  { name: '밀리의 서재', category: 'Education', priceRange: '₩9,900', description: 'E-book Subscription', website: 'https://www.millie.co.kr', plans: [{ name: '월간', price: '₩9,900' }, { name: '연간 (월환산)', price: '₩5,900' }] },
  { name: '리디 셀렉트', category: 'Education', priceRange: '₩6,500~₩13,900', description: 'E-book / Web Novel', website: 'https://ridibooks.com', plans: [{ name: '베이직', price: '₩6,500' }, { name: '프리미엄', price: '₩13,900' }] },
  // Gaming
  { name: 'Nintendo Switch Online', category: 'Gaming', priceRange: '₩3,900~₩5,900', description: 'Nintendo Online', website: 'https://www.nintendo.co.kr', plans: [{ name: '개인', price: '₩3,900' }, { name: '가족 (8인)', price: '₩5,900' }] },
  { name: 'PlayStation Plus', category: 'Gaming', priceRange: '₩6,800~₩16,700', description: 'PS Online + Games', website: 'https://www.playstation.com', plans: [{ name: 'Essential', price: '₩6,800' }, { name: 'Extra', price: '₩11,700' }, { name: 'Premium', price: '₩16,700' }] },
  { name: 'Xbox Game Pass', category: 'Gaming', priceRange: '₩8,900~₩18,900', description: 'Game Subscription', website: 'https://www.xbox.com/game-pass', plans: [{ name: 'Core', price: '₩8,900' }, { name: 'Standard', price: '₩10,900' }, { name: 'Ultimate', price: '₩18,900' }] },
  { name: 'Discord Nitro', category: 'Gaming', priceRange: '$2.99~$9.99', description: 'HD Stream, Emoji', website: 'https://discord.com/nitro', plans: [{ name: 'Nitro Basic', price: '$2.99' }, { name: 'Nitro', price: '$9.99' }] },
  { name: 'EA Play', category: 'Gaming', priceRange: '$4.99~$14.99', description: 'EA Game Library', website: 'https://www.ea.com/ea-play', plans: [{ name: 'EA Play', price: '$4.99' }, { name: 'EA Play Pro', price: '$14.99' }] },
  { name: 'Steam', category: 'Gaming', priceRange: 'Free', description: 'PC Game Platform', website: 'https://store.steampowered.com', plans: [{ name: '플랫폼 이용', price: 'Free' }] },
  // Health & Fitness
  { name: 'Calm', category: 'Health & Fitness', priceRange: '$14.99~$69.99', description: 'Meditation / Sleep', website: 'https://www.calm.com', plans: [{ name: '월간', price: '$14.99', cycle: 'mo' }, { name: '연간', price: '$69.99', cycle: 'yr' }] },
  { name: 'Headspace', category: 'Health & Fitness', priceRange: '$12.99~$69.99', description: 'Meditation Guide', website: 'https://www.headspace.com', plans: [{ name: '월간', price: '$12.99', cycle: 'mo' }, { name: '연간', price: '$69.99', cycle: 'yr' }] },
  { name: 'Strava', category: 'Health & Fitness', priceRange: '$0~$11.99', description: 'Run / Cycle Tracker', website: 'https://www.strava.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Subscriber', price: '$11.99' }] },
  { name: 'Nike Run Club+', category: 'Health & Fitness', priceRange: 'Free', description: 'Running App', website: 'https://www.nike.com/nrc-app', plans: [{ name: 'Free', price: 'Free' }] },
  { name: 'FatSecret Premium', category: 'Health & Fitness', priceRange: '$0~$6.99', description: 'Diet / Calorie', website: 'https://www.fatsecret.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Premium', price: '$6.99' }] },
  // News & Media
  { name: 'The New York Times', category: 'News & Media', priceRange: '$4~$25', description: 'Global News', website: 'https://www.nytimes.com', plans: [{ name: 'Basic Digital', price: '$4' }, { name: 'All Access', price: '$25' }] },
  { name: 'Medium', category: 'News & Media', priceRange: '$5~$15', description: 'Article Platform', website: 'https://medium.com', plans: [{ name: 'Member', price: '$5' }, { name: 'Friend of Medium', price: '$15' }] },
  { name: 'The Economist', category: 'News & Media', priceRange: '$20~$29', description: 'Business Magazine', website: 'https://www.economist.com', plans: [{ name: 'Digital', price: '$20' }, { name: 'Digital + Print', price: '$29' }] },
  { name: '조선일보 디지털', category: 'News & Media', priceRange: '₩9,900', description: 'Korean News', website: 'https://www.chosun.com', plans: [{ name: '월간', price: '₩9,900' }, { name: '연간 (월환산)', price: '₩7,400' }] },
  { name: '중앙일보 디지털', category: 'News & Media', priceRange: '₩9,900', description: 'Korean News', website: 'https://joongang.co.kr', plans: [{ name: '월간', price: '₩9,900' }, { name: '연간 (월환산)', price: '₩7,900' }] },
  // Storage
  { name: 'iCloud+', category: 'Storage', priceRange: '₩1,300~₩78,000', description: 'Apple Cloud', website: 'https://www.apple.com/icloud', plans: [{ name: '50GB', price: '₩1,300' }, { name: '200GB', price: '₩3,900' }, { name: '2TB', price: '₩13,000' }, { name: '6TB', price: '₩39,000' }, { name: '12TB', price: '₩78,000' }] },
  { name: 'pCloud', category: 'Storage', priceRange: '$4.99~$9.99', description: 'Cloud Storage', website: 'https://www.pcloud.com', plans: [{ name: 'Premium (500GB)', price: '$4.99' }, { name: 'Premium Plus (2TB)', price: '$9.99' }] },
  { name: 'MEGA', category: 'Storage', priceRange: '$5.49~$32.64', description: 'Encrypted Storage', website: 'https://mega.io', plans: [{ name: 'Pro Lite (400GB)', price: '$5.49' }, { name: 'Pro I (2TB)', price: '$10.93' }, { name: 'Pro II (8TB)', price: '$21.84' }, { name: 'Pro III (16TB)', price: '$32.64' }] },
  // Security & VPN
  { name: 'NordVPN', category: 'Security & VPN', priceRange: '$3.09~$14.99', description: 'VPN Service', website: 'https://nordvpn.com', plans: [{ name: 'Basic', price: '$3.09' }, { name: 'Plus', price: '$4.39' }, { name: 'Complete', price: '$5.79' }, { name: '월간', price: '$14.99' }] },
  { name: 'ExpressVPN', category: 'Security & VPN', priceRange: '$6.67~$12.95', description: 'Fast VPN', website: 'https://www.expressvpn.com', plans: [{ name: '12개월', price: '$6.67' }, { name: '6개월', price: '$9.99' }, { name: '월간', price: '$12.95' }] },
  { name: 'Surfshark', category: 'Security & VPN', priceRange: '$2.49~$15.45', description: 'Budget VPN', website: 'https://surfshark.com', plans: [{ name: '24개월', price: '$2.49' }, { name: '12개월', price: '$3.99' }, { name: '월간', price: '$15.45' }] },
  { name: '1Password', category: 'Security & VPN', priceRange: '$2.99~$7.99', description: 'Password Manager', website: 'https://1password.com', plans: [{ name: 'Individual', price: '$2.99' }, { name: 'Families (5인)', price: '$4.99' }, { name: 'Business', price: '$7.99' }] },
  { name: 'Bitwarden', category: 'Security & VPN', priceRange: '$0~$6', description: 'Open-source Passwords', website: 'https://bitwarden.com', plans: [{ name: 'Free', price: '$0' }, { name: 'Premium', price: '$1' }, { name: 'Families (6인)', price: '$3.33' }, { name: 'Business', price: '$6' }] },
  // Lifestyle
  { name: '쿠팡 로켓와우', category: 'Lifestyle', priceRange: '₩4,990', description: 'Free Delivery', website: 'https://www.coupang.com', plans: [{ name: '월간', price: '₩4,990' }] },
  { name: '네이버 플러스 멤버십', category: 'Lifestyle', priceRange: '₩4,900', description: 'Naver Pay Rewards', website: 'https://nid.naver.com', plans: [{ name: '월간', price: '₩4,900' }] },
  { name: '배민클럽', category: 'Lifestyle', priceRange: '₩3,900~₩7,890', description: 'Delivery Discount', website: 'https://www.baemin.com', plans: [{ name: '배민클럽', price: '₩3,900' }, { name: '배민클럽+', price: '₩7,890' }] },
  { name: '카카오톡 이모티콘 플러스', category: 'Lifestyle', priceRange: '₩4,900', description: 'Unlimited Emoticons', website: 'https://emoticon.kakao.com', plans: [{ name: '월간', price: '₩4,900' }] },
  { name: 'Amazon Prime', category: 'Lifestyle', priceRange: '$14.99~$139', description: 'Free Shipping + Video', website: 'https://www.amazon.com/prime', plans: [{ name: '월간', price: '$14.99', cycle: 'mo' }, { name: '연간', price: '$139', cycle: 'yr' }] },
];

// 캘린더 헬퍼
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }
const CAL_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const CAL_DAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CAL_MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const CAL_MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CatalogScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 구독 추가 폼 상태
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [startDate, setStartDate] = useState('');
  const [billingDate, setBillingDate] = useState('');
  const [activePickerField, setActivePickerField] = useState<'start' | 'next' | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 캘린더 데이터
  const calDaysInMonth = getDaysInMonth(calYear, calMonth);
  const calFirstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < calFirstDay; i++) cells.push(null);
    for (let i = 1; i <= calDaysInMonth; i++) cells.push(i);
    return cells;
  }, [calYear, calMonth, calDaysInMonth, calFirstDay]);

  const selectedDay = useMemo(() => {
    const dateStr = activePickerField === 'start' ? startDate : billingDate;
    if (!dateStr) return -1;
    const d = new Date(dateStr);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) return d.getDate();
    return -1;
  }, [startDate, billingDate, calYear, calMonth, activePickerField]);

  const openModal = (service: Service) => {
    setSelectedService(service);
    setSelectedPlan(null);
    setActivePickerField(null);
    setIsSubmitting(false);
    // 기본 시작일: 오늘
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
    // 기본 다음 결제일: 한 달 뒤
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    setBillingDate(next.toISOString().split('T')[0]);
    setCalYear(next.getFullYear());
    setCalMonth(next.getMonth());

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

  const handleDateSelect = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateVal = `${calYear}-${mm}-${dd}`;
    if (activePickerField === 'start') {
      setStartDate(dateVal);
    } else {
      setBillingDate(dateVal);
    }
    setActivePickerField(null);
  };

  const openDatePicker = (field: 'start' | 'next') => {
    if (activePickerField === field) {
      setActivePickerField(null);
      return;
    }
    const dateStr = field === 'start' ? startDate : billingDate;
    if (dateStr) {
      const d = new Date(dateStr);
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    }
    setActivePickerField(field);
  };

  const renderCalendarPicker = () => (
    <View style={styles.calendarPicker}>
      <View style={styles.calNav}>
        <TouchableOpacity onPress={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}>
          <Ionicons name="chevron-back" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
        <Text style={styles.calNavTitle}>
          {language === 'ko' ? `${calYear}년 ${CAL_MONTHS_KO[calMonth]}` : `${CAL_MONTHS_EN[calMonth]} ${calYear}`}
        </Text>
        <TouchableOpacity onPress={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <View style={styles.calWeekRow}>
        {(language === 'ko' ? CAL_DAYS_KO : CAL_DAYS_EN).map((d, i) => (
          <Text key={i} style={styles.calWeekDay}>{d}</Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {calendarCells.map((day, i) => {
          const isSelected = day === selectedDay;
          const now = new Date();
          const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
          return (
            <View key={i} style={styles.calCell}>
              {day && (
                <TouchableOpacity
                  style={[styles.calDayBtn, isSelected && styles.calDaySelected, isToday && !isSelected && styles.calDayToday]}
                  onPress={() => handleDateSelect(day)}
                >
                  <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected, isToday && !isSelected && { color: Colors.primary }]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const handleSubscribe = async () => {
    if (!selectedService) return;
    if (!selectedPlan && selectedService.plans && selectedService.plans.length > 0) {
      Alert.alert(
        language === 'ko' ? '요금제 선택' : 'Select Plan',
        language === 'ko' ? '요금제를 먼저 선택해주세요.' : 'Please select a plan first.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 가격 파싱: ₩13,500 → 13500, $20 → 20
      const priceStr = selectedPlan?.price ?? '0';
      const numericPrice = Number(priceStr.replace(/[^0-9.]/g, '')) || 0;
      const currency = priceStr.startsWith('$') ? 'USD' : 'KRW';
      const cycle = selectedPlan?.cycle === 'yr' ? 'yearly' : 'monthly';

      await subscriptionAPI.create({
        service_name: selectedService.name,
        plan_name: selectedPlan?.name ?? '',
        cost: numericPrice,
        currency,
        billing_cycle: cycle,
        start_date: startDate,
        next_billing_date: billingDate,
        status: 'active',
        auto_renew: true,
        is_recurring: true,
        category_name: selectedService.category,
      });
      Alert.alert(
        language === 'ko' ? '구독 추가 완료' : 'Subscription Added',
        language === 'ko'
          ? `${selectedService.name} ${selectedPlan?.name ?? ''} 구독이 추가되었습니다.`
          : `${selectedService.name} ${selectedPlan?.name ?? ''} has been added.`,
      );
      closeModal();
    } catch (e: any) {
      Alert.alert(
        language === 'ko' ? '오류' : 'Error',
        e?.response?.data?.detail || (language === 'ko' ? '구독 추가에 실패했습니다.' : 'Failed to add subscription.'),
      );
    } finally {
      setIsSubmitting(false);
    }
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
                  placeholder={t('catalog.searchPlaceholder')}
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
                  <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>
                    {cat.name === 'All' ? t('common.all') : (t((`category.${cat.name}`) as any) || cat.name)}
                  </Text>
                </TouchableOpacity>
             ))}
          </ScrollView>

          {/* 서비스 카드 그리드 */}
          <View style={styles.gridContainer}>
             <View style={styles.mainWhiteCard}>
                <View style={styles.cardHeaderRow}>
                   <Text style={styles.cardTitle}>
                     {selectedCategory === 'All' ? t('catalog.allServices') : t((`category.${selectedCategory}`) as any)}
                   </Text>
                   <Text style={styles.countText}>{filtered.length} {t('catalog.services')}</Text>
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
                    <Text style={styles.emptyText}>{t('catalog.noResults')}</Text>
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
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          </Animated.View>

          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            {selectedService && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.modalHandle} />

                {/* 서비스 헤더 */}
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

                {/* 요금제 선택 */}
                {selectedService.plans && selectedService.plans.length > 0 && (
                  <View style={styles.modalPlansSection}>
                    <Text style={styles.modalSectionTitle}>
                      {language === 'ko' ? '요금제 선택' : 'Select Plan'}
                    </Text>
                    {selectedService.plans.map((plan, i) => {
                      const isSelected = selectedPlan?.name === plan.name;
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.modalPlanRow, isSelected && styles.modalPlanRowActive]}
                          onPress={() => setSelectedPlan(plan)}
                          activeOpacity={0.6}
                        >
                          <View style={[styles.modalPlanRadio, isSelected && styles.modalPlanRadioActive]}>
                            {isSelected && <View style={styles.modalPlanRadioDot} />}
                          </View>
                          <Text style={[styles.modalPlanName, isSelected && { color: Colors.primary }]}>{plan.name}</Text>
                          <Text style={[styles.modalPlanPrice, isSelected && { color: Colors.primary }]}>
                            {formatPlanPrice(plan.price, plan.cycle, language)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* 결제 시작일 + 다음 결제일 (한 줄) */}
                <View style={styles.modalDateRow}>
                  <View style={styles.modalDateCol}>
                    <Text style={styles.modalSectionTitle}>
                      {language === 'ko' ? '결제 시작일' : 'Start Date'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.modalDateInput, activePickerField === 'start' && styles.modalDateInputActive]}
                      onPress={() => openDatePicker('start')}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.modalDateText} numberOfLines={1}>{startDate || 'YYYY-MM-DD'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalDateCol}>
                    <Text style={styles.modalSectionTitle}>
                      {language === 'ko' ? '다음 결제일' : 'Next Billing'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.modalDateInput, activePickerField === 'next' && styles.modalDateInputActive]}
                      onPress={() => openDatePicker('next')}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.modalDateText} numberOfLines={1}>{billingDate || 'YYYY-MM-DD'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {activePickerField && renderCalendarPicker()}

                {/* 선택 요약 */}
                {selectedPlan && (
                  <View style={styles.modalSummary}>
                    <View style={styles.modalSummaryRow}>
                      <Text style={styles.modalSummaryLabel}>{language === 'ko' ? '선택 요금제' : 'Plan'}</Text>
                      <Text style={styles.modalSummaryValue}>{selectedPlan.name}</Text>
                    </View>
                    <View style={styles.modalSummaryRow}>
                      <Text style={styles.modalSummaryLabel}>{language === 'ko' ? '금액' : 'Price'}</Text>
                      <Text style={[styles.modalSummaryValue, { color: Colors.primary }]}>
                        {formatPlanPrice(selectedPlan.price, selectedPlan.cycle, language)}
                      </Text>
                    </View>
                    <View style={styles.modalSummaryRow}>
                      <Text style={styles.modalSummaryLabel}>{language === 'ko' ? '시작일' : 'Start Date'}</Text>
                      <Text style={styles.modalSummaryValue}>{startDate}</Text>
                    </View>
                    <View style={styles.modalSummaryRow}>
                      <Text style={styles.modalSummaryLabel}>{language === 'ko' ? '다음 결제일' : 'Next Billing'}</Text>
                      <Text style={styles.modalSummaryValue}>{billingDate}</Text>
                    </View>
                  </View>
                )}

                {/* 공식 사이트 */}
                {selectedService.website && (
                  <TouchableOpacity
                    style={styles.modalWebBtn}
                    onPress={() => Linking.openURL(selectedService.website!)}
                  >
                    <Ionicons name="globe-outline" size={18} color={Colors.primary} />
                    <Text style={styles.modalWebText}>{t('catalog.visitWebsite')}</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}

                {/* 구독 추가 버튼 */}
                <TouchableOpacity
                  style={[styles.modalSubscribeBtn, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSubscribe}
                  disabled={isSubmitting}
                >
                  <Ionicons name="add-circle" size={20} color="#FFF" />
                  <Text style={styles.modalSubscribeBtnText}>
                    {isSubmitting
                      ? (language === 'ko' ? '추가 중...' : 'Adding...')
                      : t('catalog.addSubscription')}
                  </Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
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
    marginBottom: Spacing.md,
  },
  modalPlanRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 4,
  },
  modalPlanRowActive: { backgroundColor: Colors.primaryLight },
  modalPlanRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.textTertiary,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  modalPlanRadioActive: { borderColor: Colors.primary },
  modalPlanRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  modalPlanName: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  modalPlanPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  // 날짜 선택
  modalDateRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  modalDateCol: { flex: 1 },
  modalDateSection: { marginBottom: Spacing.lg },
  modalDateInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceLight, borderRadius: 12, paddingHorizontal: 12, height: 44,
  },
  modalDateInputActive: { borderWidth: 1.5, borderColor: Colors.primary },
  modalDateText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  // 캘린더
  calendarPicker: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: 14, marginTop: Spacing.md },
  calNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: Spacing.md },
  calNavTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  calWeekRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: FontWeight.heavy, color: Colors.textTertiary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calDayBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  calDaySelected: { backgroundColor: Colors.primary },
  calDayToday: { backgroundColor: Colors.primarySoft },
  calDayText: { fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  calDayTextSelected: { color: '#FFF' },
  // 요약
  modalSummary: {
    backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: 16, marginBottom: Spacing.lg,
  },
  modalSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  modalSummaryLabel: { fontSize: FontSize.sm, color: Colors.textTertiary },
  modalSummaryValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
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
