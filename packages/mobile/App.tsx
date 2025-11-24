import { StatusBar } from 'expo-status-bar';
import { Alert, Animated, Button, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Video } from 'expo-av';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAuthStore, validateRut, UserProfile, Product, Service, Message, Post, StickerData, Wish, WishHelp } from './src/store';
import { holochainClient } from './src/holochain';
import Svg, { Path, G } from 'react-native-svg';

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string; token: string };
  MainTabs: undefined;
  Profile: undefined;
  Verification: undefined;
  ProductDetail: { product: Product };
  ServiceDetail: { service: Service };
  CreateProduct: undefined;
  CreateService: undefined;
  CreateAccommodation: undefined;
  CreatePost: undefined;
  Chats: undefined;
  Chat: { userId: string; userName: string };
  VideoCall: { userId: string; userName: string };
  UserOptions: { user: UserProfile };
  Tamagochi: undefined;
  DriversMap: undefined;
  RegisterDriver: undefined;
  ShareLocation: { userId: string; userName: string };
  RequestRide: undefined;
  RideQuotes: { pickupLat: number; pickupLon: number; dropoffLat: number; dropoffLon: number };
  Wishes: undefined;
  CreateWish: undefined;
  WishDetail: { wish: Wish };
  Airbnb: undefined;
  SearchAccommodations: undefined;
  AccommodationDetail: { service: Service };
  BookAccommodation: { service: Service };
  VisitTamagochi: { userId: string; userName: string };
  SetProfileCover: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333';

function GripLogoSVG({ width = 200, height = 200 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      <G>
        {/* Logo "G" estilizado para Grip - más simple y elegante */}
        <Path
          d="M 140 30 C 160 30 175 45 175 65 L 175 135 C 175 155 160 170 140 170 L 60 170 C 40 170 25 155 25 135 L 25 65 C 25 45 40 30 60 30 L 140 30 Z M 140 50 L 60 50 C 50 50 45 55 45 65 L 45 135 C 45 145 50 150 60 150 L 140 150 C 150 150 155 145 155 135 L 155 100 L 115 100 C 110 100 105 95 105 90 L 105 75 C 105 70 110 65 115 65 L 155 65 C 155 55 150 50 140 50 Z"
          fill="#1f7aec"
        />
        {/* Puntos de conexión (network nodes) */}
        <Path d="M 40 60 C 43 60 45 62 45 65 C 45 68 43 70 40 70 C 37 70 35 68 35 65 C 35 62 37 60 40 60 Z" fill="#1f7aec" opacity="0.7" />
        <Path d="M 40 130 C 43 130 45 132 45 135 C 45 138 43 140 40 140 C 37 140 35 138 35 135 C 35 132 37 130 40 130 Z" fill="#1f7aec" opacity="0.7" />
        <Path d="M 160 60 C 163 60 165 62 165 65 C 165 68 163 70 160 70 C 157 70 155 68 155 65 C 155 62 157 60 160 60 Z" fill="#1f7aec" opacity="0.7" />
        <Path d="M 160 130 C 163 130 165 132 165 135 C 165 138 163 140 160 140 C 157 140 155 138 155 135 C 155 132 157 130 160 130 Z" fill="#1f7aec" opacity="0.7" />
      </G>
    </Svg>
  );
}

function SplashScreen({ navigation }: any) {
  const [logoWidth] = useState(200);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const currentUser = useAuthStore((s) => s.currentUser);
  const { tamagochi, updateTamagochiState, feedTamagochi, loadTamagochi, tamagochiEnabled } = useAuthStore();

  useEffect(() => {
    // Animar la barra de progreso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    // Auto-update tamagochi and feed on app start (only if enabled)
    if (currentUser && tamagochiEnabled) {
      loadTamagochi().then(() => {
        const currentTamagochi = useAuthStore.getState().tamagochi;
        if (currentTamagochi && currentTamagochi.isAlive) {
          updateTamagochiState().then(() => {
            // Auto-feed on app entry
            feedTamagochi().catch(console.error);
          }).catch(console.error);
        }
      }).catch(console.error);
    }
    
    // Update last seen on app start (only if not in ghost mode)
    if (currentUser) {
      const { ghostMode, updateLastSeen } = useAuthStore.getState();
      if (!ghostMode) {
        updateLastSeen().catch(console.error);
        // Update every 5 minutes
        const lastSeenInterval = setInterval(() => {
          if (!useAuthStore.getState().ghostMode) {
            updateLastSeen().catch(console.error);
          }
        }, 300000); // 5 minutes
        
        return () => clearInterval(lastSeenInterval);
      }
    }

    // Navegar después de 2.5 segundos - siempre a MainTabs (si hay usuario) o Login
    const timer = setTimeout(() => {
      if (currentUser) {
        // Si ya hay usuario, ir directo a la grilla de perfiles
        navigation.replace('MainTabs');
      } else {
        // Si no hay usuario, mostrar login
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentUser, navigation, tamagochi, updateTamagochiState, feedTamagochi]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, logoWidth],
  });

  return (
    <View style={styles.splashContainer}>
      <GripLogoSVG width={logoWidth} height={logoWidth} />
      <View style={[styles.loaderContainer, { width: logoWidth }]}>
        <View style={styles.loaderTrack} />
        <Animated.View style={[styles.loaderBar, { width: progressWidth }]} />
      </View>
    </View>
  );
}

function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const loginSimple = useAuthStore((s) => s.loginSimple);
  
  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Completa email y contraseña');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigation.replace('MainTabs');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginContent}>
        <GripLogoSVG width={150} height={150} />
        <Text style={styles.loginTitle}>Red Libre</Text>
        <Text style={styles.loginSubtitle}>Conecta con tu comunidad</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.loginInput}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          style={styles.loginInput}
          secureTextEntry
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, (!email.trim() || !password.trim() || loading) && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={!email.trim() || !password.trim() || loading}
        >
          <Text style={styles.loginButtonText}>{loading ? 'Iniciando...' : 'Entrar'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const register = useAuthStore((s) => s.register);
  
  async function handleRegister() {
    if (!email.trim() || !password.trim() || !name.trim()) {
      setError('Completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), password, name.trim());
      navigation.replace('MainTabs');
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        style={styles.input}
        autoCapitalize="words"
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{loading ? 'Registrando...' : 'Registrarse'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Ya tengo cuenta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  
  async function handleRequest() {
    if (!email.trim()) {
      setError('Ingresa tu email');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const token = await requestPasswordReset(email.trim());
      // In production, token would be sent via email
      // For now, show it to user (should be removed in production)
      alert(`Token de recuperación: ${token}\n\n(En producción, esto se enviaría por email)`);
      navigation.navigate('ResetPassword', { email: email.trim(), token });
    } catch (err: any) {
      setError(err.message || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleRequest}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? 'Enviando...' : 'Enviar link de recuperación'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ResetPasswordScreen({ route, navigation }: any) {
  const { email, token } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  
  async function handleReset() {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Completa ambos campos');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email, token, newPassword);
      alert('Contraseña actualizada. Inicia sesión.');
      navigation.replace('Login');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nueva contraseña</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <TextInput
        placeholder="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileButton({ onPress, uri }: { onPress: () => void; uri?: string }) {
  return (
    <TouchableOpacity onPress={onPress}>
      {uri ? (
        <Image source={{ uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
      ) : (
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc' }} />
      )}
    </TouchableOpacity>
  );
}

// Grilla estilo Grindr
function ProfilesGridScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.currentUser);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { getProfileCover, tamagochiEnabled } = useAuthStore();
  const [locationGranted, setLocationGranted] = useState<boolean>(false);
  const [others, setOthers] = useState<UserProfile[]>([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState<boolean>(false);
  const [neighborsError, setNeighborsError] = useState<string | null>(null);
  const [userCovers, setUserCovers] = useState<Record<string, any>>({});
  const [userTamagochis, setUserTamagochis] = useState<Record<string, any>>({});

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ProfileButton
          uri={user?.idPhotoUri}
          onPress={() => navigation.navigate('Profile')}
        />
      ),
    });
  }, [navigation, user?.idPhotoUri]);

  const loadNeighbors = useCallback(async () => {
    try {
      setLoadingNeighbors(true);
      setNeighborsError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNeighborsError('Permite la ubicación para encontrar vecinos cercanos.');
        setLocationGranted(false);
        setOthers([]);
        return;
      }

      setLocationGranted(true);
      const position = await Location.getCurrentPositionAsync({});
      updateProfile({ lat: position.coords.latitude, lon: position.coords.longitude });

      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const validProfiles: UserProfile[] = Array.isArray(data)
        ? data.filter(
            (item: Partial<UserProfile>): item is UserProfile =>
              typeof item?.id === 'string' && typeof item?.name === 'string'
          )
        : [];

      if (validProfiles.length === 0) {
        setNeighborsError('Aún no hay vecinos registrados. Invita a tu comunidad a unirse.');
      }
      setOthers(validProfiles);
    } catch (err) {
      console.error('Error loading neighbors', err);
      setNeighborsError('No pudimos cargar usuarios reales por ahora.');
      setOthers([]);
    } finally {
      setLoadingNeighbors(false);
    }
  }, [updateProfile]);

  useEffect(() => {
    loadNeighbors();
  }, [loadNeighbors]);

  const sorted = useMemo(() => {
    if (!user?.lat || !user?.lon) return others;
    const d = (a: UserProfile) =>
      Math.hypot((a.lat ?? 0) - user.lat!, (a.lon ?? 0) - user.lon!);
    return [...others].sort((a, b) => d(a) - d(b));
  }, [others, user?.lat, user?.lon]);

  useEffect(() => {
    // Load covers and tamagochis for all users
    others.forEach(async (item) => {
      try {
        const cover = await getProfileCover(item.id);
        if (cover) {
          setUserCovers(prev => ({ ...prev, [item.id]: cover }));
        }
        if (tamagochiEnabled) {
          const tamagochi = await holochainClient.getTamagochiForUser(item.id);
          if (tamagochi) {
            setUserTamagochis(prev => ({ ...prev, [item.id]: tamagochi }));
          }
        }
      } catch (error) {
        // Silently fail
      }
    });
  }, [others, getProfileCover, tamagochiEnabled]);
  
  const getTamagochiEmoji = (tamagochi: any) => {
    if (!tamagochi || !tamagochi.is_alive) return null;
    switch (tamagochi.stage) {
      case 'egg': return '🥚';
      case 'baby': return '👶';
      case 'child': return '🧒';
      case 'teen': return '🧑';
      case 'adult': return '👤';
      default: return null;
    }
  };
  
  const renderGridItem = ({ item }: { item: UserProfile }) => {
    const distance = user?.lat && user?.lon && item.lat && item.lon
      ? Math.round(Math.hypot((item.lat - user.lat) * 111, (item.lon - user.lon) * 111) * 10) / 10
      : null;
    
    const cover = userCovers[item.id];
    const tamagochi = userTamagochis[item.id];
    const showTamagochi = cover?.cover_type === 'tamagochi' && tamagochi && tamagochi.is_alive;
    const tamagochiEmoji = getTamagochiEmoji(tamagochi);

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => navigation.navigate('UserOptions', { user: item })}
        onLongPress={() => navigation.navigate('UserOptions', { user: item })}
      >
        <View style={styles.gridItemImage}>
          {showTamagochi && tamagochiEmoji ? (
            <View style={[styles.gridItemImg, { backgroundColor: '#e8f4f8', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.gridItemTamagochiEmoji}>{tamagochiEmoji}</Text>
            </View>
          ) : cover?.cover_type === 'image' ? (
            <View style={[styles.gridItemImg, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.gridItemCoverIcon}>📷</Text>
            </View>
          ) : cover?.cover_type === 'video' ? (
            <View style={[styles.gridItemImg, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={styles.gridItemCoverIcon}>🎥</Text>
            </View>
          ) : item.idPhotoUri ? (
            <Image source={{ uri: item.idPhotoUri }} style={styles.gridItemImg} />
          ) : (
            <View style={[styles.gridItemImg, { backgroundColor: '#ddd' }]} />
          )}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.gridItemName} numberOfLines={1}>{item.name}</Text>
        {distance !== null && <Text style={styles.gridItemDistance}>{distance} km</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!locationGranted && (
        <View style={styles.warning}>
          <Text>Concede permisos de ubicación para ver usuarios cercanos.</Text>
        </View>
      )}
      {neighborsError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>{neighborsError}</Text>
        </View>
      )}
      <FlatList
        data={sorted}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        refreshing={loadingNeighbors}
        onRefresh={loadNeighbors}
        ListEmptyComponent={
          loadingNeighbors ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>Cargando vecinos verificados...</Text>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>
                {neighborsError ?? 'Aún no hay vecinos disponibles en tu zona.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

function MarketplaceScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      setProductsError(null);
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const validProducts: Product[] = Array.isArray(data)
        ? data.filter(
            (item: Partial<Product>): item is Product =>
              typeof item?.id === 'string' &&
              typeof item?.title === 'string' &&
              typeof item?.price === 'number'
          )
        : [];
      if (validProducts.length === 0) {
        setProductsError('Todavía no hay publicaciones. Sé la primera persona en vender algo de confianza.');
      }
      setProducts(validProducts);
    } catch (err) {
      console.error('Error loading products', err);
      setProducts([]);
      setProductsError('No pudimos cargar el mercado comunitario por ahora.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, item.sold && styles.productCardSold]}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.productImagePlaceholder}>
        {item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <Text style={styles.productImageText}>📦</Text>
        )}
        {item.sold && <View style={styles.soldBadge}><Text style={styles.soldBadgeText}>VENDIDO</Text></View>}
      </View>
      <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.productPrice}>${item.price.toLocaleString()} {item.currency}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {productsError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>{productsError}</Text>
        </View>
      )}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateProduct')}
        >
          <Text style={styles.createBtnText}>+ Vender algo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products.filter((p) => !p.sold)}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        refreshing={loadingProducts}
        onRefresh={loadProducts}
        ListEmptyComponent={
          loadingProducts ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>Cargando publicaciones reales...</Text>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>
                {productsError ?? 'No hay productos disponibles todavía.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

// Taxi Screen - Reemplaza ServicesScreen con enfoque en taxis
function TaxiScreen({ navigation }: any) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { getDriverInfo, getAvailableDrivers } = useAuthStore();
  const [isDriver, setIsDriver] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    checkDriverStatus();
    loadDrivers();
    const interval = setInterval(loadDrivers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  async function checkDriverStatus() {
    if (!currentUser) return;
    try {
      const info = await getDriverInfo();
      setIsDriver(!!info);
    } catch (error) {
      setIsDriver(false);
    }
  }
  
  async function loadDrivers() {
    try {
      setLoading(true);
      const drivers = await getAvailableDrivers();
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.taxiHeader}>
        <Text style={styles.taxiTitle}>🚕 Taxi</Text>
        <Text style={styles.taxiSubtitle}>Transporte transparente y directo</Text>
      </View>
      
      {!isDriver && (
        <TouchableOpacity
          style={styles.driverRegisterBtn}
          onPress={() => navigation.navigate('RegisterDriver')}
        >
          <Text style={styles.driverRegisterBtnText}>👤 Registrarse como conductor</Text>
        </TouchableOpacity>
      )}
      
      {isDriver && (
        <TouchableOpacity
          style={styles.driverDashboardBtn}
          onPress={() => navigation.navigate('DriversMap')}
        >
          <Text style={styles.driverDashboardBtnText}>📊 Panel de conductor</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.requestRideBtn}
        onPress={() => navigation.navigate('RequestRide')}
      >
        <Text style={styles.requestRideBtnText}>📍 Pedir un taxi</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.viewMapBtn}
        onPress={() => navigation.navigate('DriversMap')}
      >
        <Text style={styles.viewMapBtnText}>🗺️ Ver mapa de conductores</Text>
      </TouchableOpacity>
      
      {availableDrivers.length > 0 && (
        <View style={styles.driversListSection}>
          <Text style={styles.sectionTitle}>Conductores disponibles ({availableDrivers.length})</Text>
          <FlatList
            data={availableDrivers}
            keyExtractor={(item, index) => `driver_${index}`}
            renderItem={({ item }) => (
              <View style={styles.driverCard}>
                <Text style={styles.driverName}>{item.driverName || 'Conductor'}</Text>
                {item.vehicleInfo && (
                  <Text style={styles.driverVehicle}>
                    {item.vehicleInfo.make} {item.vehicleInfo.model}
                  </Text>
                )}
                {item.distanceKm !== undefined && (
                  <Text style={styles.driverDistance}>
                    📍 A {item.distanceKm.toFixed(1)} km
                  </Text>
                )}
                {item.estimatedPrice && (
                  <Text style={styles.driverPrice}>
                    💰 ${item.estimatedPrice.toLocaleString()} {item.currency || 'CLP'}
                  </Text>
                )}
              </View>
            )}
            refreshing={loading}
            onRefresh={loadDrivers}
          />
        </View>
      )}
    </View>
  );
}

// Mantener ServicesScreen para otros servicios (habitaciones, etc.)
function ServicesScreen({ navigation }: any) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      setLoadingServices(true);
      setServicesError(null);
      const response = await fetch(`${API_BASE_URL}/api/services`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const validServices: Service[] = Array.isArray(data)
        ? data.filter(
            (item: Partial<Service>): item is Service =>
              typeof item?.id === 'string' &&
              typeof item?.title === 'string' &&
              typeof item?.type === 'string'
          )
        : [];
      if (validServices.length === 0) {
        setServicesError('Todavía no hay servicios publicados. Invita a tus contactos verificados a publicar.');
      }
      setServices(validServices);
    } catch (err) {
      console.error('Error loading services', err);
      setServices([]);
      setServicesError('No pudimos cargar los servicios reales en este momento.');
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const getServiceIcon = (type: Service['type']) => {
    switch (type) {
      case 'taxi': return '🚕';
      case 'delivery': return '🚴';
      case 'room_rental': return '🏠';
      case 'professional': return '💼';
      default: return '⚙️';
    }
  };

  const getServiceTypeLabel = (type: Service['type']) => {
    switch (type) {
      case 'taxi': return 'TAXI';
      case 'delivery': return 'DELIVERY';
      case 'room_rental': return 'HABITACIÓN';
      case 'professional': return 'PROFESIONAL';
      default: return 'OTRO';
    }
  };

  const getPriceText = (item: Service) => {
    if (item.pricePerKm) return `$${item.pricePerKm.toLocaleString()}/km`;
    if (item.pricePerNight) return `$${item.pricePerNight.toLocaleString()}/noche`;
    if (item.pricePerHour) return `$${item.pricePerHour.toLocaleString()}/hora`;
    if (item.basePrice) return `$${item.basePrice.toLocaleString()} base`;
    return 'Consultar precio';
  };

  const filteredServices = useMemo(() => {
    const available = services.filter(s => s.available);
    if (selectedFilter === 'all') return available;
    return available.filter(s => s.type === selectedFilter);
  }, [services, selectedFilter]);

  const renderService = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={[styles.serviceCard, !item.available && styles.serviceCardUnavailable]}
      onPress={() => navigation.navigate('ServiceDetail', { service: item })}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceType}>
          {getServiceIcon(item.type)} {getServiceTypeLabel(item.type)}
          {item.type === 'professional' && item.professionalCategory && (
            <Text style={styles.professionalCategory}> • {item.professionalCategory}</Text>
          )}
        </Text>
        {item.available ? (
          <View style={styles.availableBadge}><Text style={styles.availableBadgeText}>Disponible</Text></View>
        ) : (
          <View style={styles.unavailableBadge}><Text style={styles.unavailableBadgeText}>No disponible</Text></View>
        )}
      </View>
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>
      {item.type === 'room_rental' && item.roomCapacity && (
        <Text style={styles.roomInfo}>👥 {item.roomCapacity} personas</Text>
      )}
      {item.type === 'room_rental' && item.amenities && item.amenities.length > 0 && (
        <Text style={styles.roomAmenities}>{item.amenities.join(' • ')}</Text>
      )}
      <Text style={styles.servicePrice}>{getPriceText(item)} {item.currency}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {servicesError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorCardText}>{servicesError}</Text>
        </View>
      )}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateService')}
        >
          <Text style={styles.createBtnText}>+ Ofrecer servicio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'taxi' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('taxi')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'taxi' && styles.filterChipTextActive]}>
            🚕 Taxi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'room_rental' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('room_rental')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'room_rental' && styles.filterChipTextActive]}>
            🏠 Habitaciones
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'professional' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('professional')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'professional' && styles.filterChipTextActive]}>
            💼 Profesionales
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'delivery' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('delivery')}
        >
          <Text style={[styles.filterChipText, selectedFilter === 'delivery' && styles.filterChipTextActive]}>
            🚴 Delivery
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={loadingServices}
        onRefresh={loadServices}
        ListEmptyComponent={
          loadingServices ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>Cargando servicios reales...</Text>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>
                {servicesError ?? 'No hay servicios disponibles en esta categoría.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.currentUser)!;
  const logout = useAuthStore((s) => s.logout);
  const { tamagochi, tamagochiDeaths, loadTamagochiDeaths, loadTamagochi, updateTamagochiState, feedTamagochi, tamagochiEnabled, getProfileCover } = useAuthStore();
  const [profileCover, setProfileCover] = useState<any>(null);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [coverVideoUri, setCoverVideoUri] = useState<string | null>(null);
  
  useEffect(() => {
    if (tamagochiEnabled) {
      loadTamagochi();
      loadTamagochiDeaths();
      if (tamagochi && tamagochi.isAlive) {
        // Auto-update and auto-feed on profile view
        updateTamagochiState().then(() => {
          feedTamagochi().catch(console.error);
        }).catch(console.error);
      }
    }
    loadCover();
  }, [tamagochiEnabled]);
  
  async function loadCover() {
    try {
      const cover = await getProfileCover(user.id);
      setProfileCover(cover);
      
      if (cover) {
        if (cover.cover_type === 'image' && cover.image_hash) {
          try {
            const image = await holochainClient.getImage(cover.image_hash);
            if (image) {
              const blob = new Blob([image.bytes], { type: image.mime_type });
              setCoverImageUri(URL.createObjectURL(blob));
            }
          } catch (error) {
            console.error('Error loading cover image:', error);
          }
        } else if (cover.cover_type === 'video' && cover.video_hash) {
          try {
            const video = await holochainClient.getImage(cover.video_hash);
            if (video) {
              const blob = new Blob([video.bytes], { type: video.mime_type });
              setCoverVideoUri(URL.createObjectURL(blob));
            }
          } catch (error) {
            console.error('Error loading cover video:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile cover:', error);
    }
  }
  
  const getTamagochiEmoji = () => {
    if (!tamagochi || !tamagochi.isAlive) return '🥚';
    switch (tamagochi.stage) {
      case 'egg': return '🥚';
      case 'baby': return '👶';
      case 'child': return '🧒';
      case 'teen': return '🧑';
      case 'adult': return '👤';
      default: return '🥚';
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Profile Cover - Tamagochi or Image/Video */}
      <View style={styles.profileCoverContainer}>
        {profileCover?.cover_type === 'image' && coverImageUri ? (
          <Image source={{ uri: coverImageUri }} style={styles.profileCover} />
        ) : profileCover?.cover_type === 'video' && coverVideoUri ? (
          <Video source={{ uri: coverVideoUri }} style={styles.profileCover} useNativeControls={false} resizeMode="cover" />
        ) : tamagochiEnabled && tamagochi && tamagochi.isAlive ? (
          <View style={styles.profileCoverTamagochi}>
            <Text style={styles.profileCoverTamagochiEmoji}>{getTamagochiEmoji()}</Text>
            <Text style={styles.profileCoverTamagochiName}>{tamagochi.name}</Text>
          </View>
        ) : (
          <View style={[styles.profileCover, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.profileCoverPlaceholder}>📷</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.editCoverBtn}
          onPress={() => navigation.navigate('SetProfileCover')}
        >
          <Text style={styles.editCoverBtnText}>✏️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileHeader}>
        {user.idPhotoUri ? (
          <Image source={{ uri: user.idPhotoUri }} style={styles.profilePhoto} />
        ) : (
          <View style={[styles.profilePhoto, { backgroundColor: '#ddd' }]} />
        )}
        <View style={styles.userNameContainer}>
          <Text style={styles.profileName}>{user.name}</Text>
          {user.isVerified && <VerifiedBadge size={24} />}
        </View>
        {user.isVerified && (
          <View style={styles.verifiedBadgeLarge}>
            <Text style={styles.verifiedBadgeLargeText}>✓ Humano Verificado</Text>
          </View>
        )}
      </View>

      {tamagochiEnabled && tamagochi && tamagochi.isAlive && (
        <TouchableOpacity
          style={styles.tamagochiCard}
          onPress={() => navigation.navigate('Tamagochi')}
        >
          <Text style={styles.tamagochiCardTitle}>🐣 {tamagochi.name}</Text>
          <Text style={styles.tamagochiCardStage}>
            {tamagochi.stage === 'egg' ? '🥚 Huevo' :
             tamagochi.stage === 'baby' ? '👶 Bebé' :
             tamagochi.stage === 'child' ? '🧒 Niño' :
             tamagochi.stage === 'teen' ? '🧑 Adolescente' :
             '👤 Adulto'}
          </Text>
          <View style={styles.tamagochiStats}>
            <Text style={styles.tamagochiStat}>⚡ {tamagochi.energy}%</Text>
            <Text style={styles.tamagochiStat}>🍖 {tamagochi.hunger}%</Text>
            <Text style={styles.tamagochiStat}>🧼 {tamagochi.hygiene}%</Text>
            <Text style={styles.tamagochiStat}>😊 {tamagochi.happiness}%</Text>
          </View>
        </TouchableOpacity>
      )}

      {tamagochiDeaths.length > 0 && (
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>En Memoria</Text>
          {tamagochiDeaths.map((death, idx) => (
            <View key={idx} style={styles.deathMemorial}>
              <Text style={styles.deathCross}>✝</Text>
              <Text style={styles.deathName}>{death.tamagochiName}</Text>
              <Text style={styles.deathReason}>
                {death.deathReason === 'killed' ? 'Asesinado' :
                 death.deathReason === 'starvation' ? 'Murió de hambre' :
                 'Falleció'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.profileField}>
          <Text style={styles.fieldLabel}>RUT:</Text>
          <Text style={styles.fieldValue}>{user.rut || 'No registrado'}</Text>
        </View>
        <View style={styles.profileField}>
          <Text style={styles.fieldLabel}>Estado:</Text>
          <Text style={styles.fieldValue}>{user.isVerified ? 'Verificado' : 'No verificado'}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('Verification')}
      >
        <Text style={styles.primaryBtnText}>
          {user.isVerified ? 'Actualizar verificación' : 'Verificar cuenta'}
        </Text>
      </TouchableOpacity>

      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={styles.profileField}>
          <Text style={styles.fieldLabel}>Tamagochi:</Text>
          <TouchableOpacity
            onPress={() => {
              const { tamagochiEnabled, setTamagochiEnabled } = useAuthStore.getState();
              setTamagochiEnabled(!tamagochiEnabled);
            }}
            style={styles.toggleSwitch}
          >
            <Text style={styles.fieldValue}>
              {useAuthStore.getState().tamagochiEnabled ? 'Activado' : 'Desactivado'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileField}>
          <Text style={styles.fieldLabel}>Modo Ghost:</Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                await setGhostMode(!ghostMode);
              } catch (error) {
                Alert.alert('Error', 'No se pudo cambiar el modo ghost');
              }
            }}
            style={styles.toggleSwitch}
          >
            <Text style={[styles.fieldValue, ghostMode && { color: '#1f7aec', fontWeight: '600' }]}>
              {ghostMode ? '👻 Activado (invisible)' : 'Visible'}
            </Text>
          </TouchableOpacity>
        </View>
        {ghostMode && (
          <Text style={styles.infoCardText}>
            👻 En modo ghost, otros usuarios no podrán verte como conectado. Es como un bloqueo más suave.
          </Text>
        )}
      </View>

      <View style={{ height: 16 }} />
      <Button title="Salir" onPress={logout} />
    </ScrollView>
  );
}

function VerificationScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.currentUser)!;
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [rut, setRut] = useState(user.rut ?? '');
  const [error, setError] = useState<string | null>(null);

  async function pickIdPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      updateProfile({ idPhotoUri: result.assets[0].uri });
    }
  }

  function submit() {
    if (!validateRut(rut)) {
      setError('RUT inválido');
      return;
    }
    if (!user.idPhotoUri) {
      setError('Sube la foto de tu carnet');
      return;
    }
    setError(null);
    updateProfile({ rut, isVerified: true });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificación</Text>
      <TextInput
        placeholder="RUT (ej: 12.345.678-5)"
        value={rut}
        onChangeText={setRut}
        style={styles.input}
        autoCapitalize="characters"
      />
      <TouchableOpacity style={styles.secondaryBtn} onPress={pickIdPhoto}>
        <Text style={styles.secondaryBtnText}>{user.idPhotoUri ? 'Cambiar foto de carnet' : 'Subir foto de carnet'}</Text>
      </TouchableOpacity>
      {user.idPhotoUri && (
        <Image source={{ uri: user.idPhotoUri }} style={{ width: 160, height: 120, marginTop: 12, borderRadius: 8 }} />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.primaryBtn} onPress={submit}>
        <Text style={styles.primaryBtnText}>Confirmar</Text>
      </TouchableOpacity>
    </View>
  );
}

function CreateProductScreen({ navigation }: any) {
  const { createProduct } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('CLP');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  async function handlePickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a las imágenes');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImages([...images, ...result.assets.map(a => a.uri)]);
    }
  }
  
  async function handleCreate() {
    if (!title.trim() || !description.trim() || !price.trim()) {
      alert('Completa todos los campos');
      return;
    }
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Ingresa un precio válido');
      return;
    }
    
    if (images.length === 0) {
      alert('Agrega al menos una imagen del producto');
      return;
    }
    
    setLoading(true);
    try {
      // Get current location if available
      let lat: number | undefined;
      let lon: number | undefined;
      try {
        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      } catch (e) {
        // Location not available, continue without it
      }
      
      await createProduct(title.trim(), description.trim(), priceNum, currency, images, lat, lon);
      alert('Producto publicado exitosamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error al publicar el producto');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vender producto</Text>
      
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: iPhone 13 Pro Max"
        placeholderTextColor="#999"
      />
      
      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe tu producto..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.priceRow}>
        <View style={styles.priceInputContainer}>
          <Text style={styles.label}>Precio *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.currencyContainer}>
          <Text style={styles.label}>Moneda</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder="CLP"
            placeholderTextColor="#999"
          />
        </View>
      </View>
      
      <Text style={styles.label}>Imágenes *</Text>
      <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImages}>
        <Text style={styles.imagePickerBtnText}>📷 Agregar imágenes</Text>
      </TouchableOpacity>
      
      {images.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.imagePreviewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImages(images.filter((_, i) => i !== idx))}
              >
                <Text style={styles.removeImageBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{loading ? 'Publicando...' : 'Publicar producto'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CreateServiceScreen({ navigation }: any) {
  const { createService } = useAuthStore();
  const [serviceType, setServiceType] = useState<'taxi' | 'delivery' | 'professional' | 'other'>('taxi');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [currency, setCurrency] = useState('CLP');
  const [professionalCategory, setProfessionalCategory] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const professionalCategories = [
    'Abogado', 'Contador', 'Ingeniero', 'Médico', 'Psicólogo', 
    'Diseñador', 'Programador', 'Carpintero', 'Plomero', 'Electricista',
    'Pintor', 'Jardinero', 'Chef', 'Fotógrafo', 'Otro'
  ];
  
  async function handlePickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a las imágenes');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImageUris([...imageUris, ...result.assets.map(a => a.uri)]);
    }
  }
  
  async function handleCreate() {
    if (!title.trim() || !description.trim()) {
      alert('Completa título y descripción');
      return;
    }
    
    if (serviceType === 'taxi' && !pricePerKm.trim() && !basePrice.trim()) {
      alert('Indica precio por km o precio base');
      return;
    }
    
    if (serviceType === 'professional' && !pricePerHour.trim()) {
      alert('Indica precio por hora');
      return;
    }
    
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat: number | undefined;
      let lon: number | undefined;
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      }
      
      await createService({
        service_type: serviceType,
        title: title.trim(),
        description: description.trim(),
        price_per_km: pricePerKm ? parseFloat(pricePerKm) : undefined,
        base_price: basePrice ? parseFloat(basePrice) : undefined,
        price_per_hour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        currency,
        image_hashes: imageUris,
        lat,
        lon,
        professional_category: professionalCategory || undefined,
      });
      
      alert('Servicio publicado exitosamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error al publicar el servicio');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ofrecer servicio</Text>
      
      <Text style={styles.label}>Tipo de servicio *</Text>
      <View style={styles.typeSelector}>
        {(['taxi', 'delivery', 'professional', 'other'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeOption,
              serviceType === type && styles.typeOptionSelected
            ]}
            onPress={() => setServiceType(type)}
          >
            <Text style={[
              styles.typeOptionText,
              serviceType === type && styles.typeOptionTextSelected
            ]}>
              {type === 'taxi' ? '🚕 Taxi' :
               type === 'delivery' ? '🚴 Delivery' :
               type === 'professional' ? '💼 Profesional' : '🔧 Otro'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Servicio de taxi confiable"
        placeholderTextColor="#999"
      />
      
      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe tu servicio..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
      />
      
      {serviceType === 'taxi' && (
        <>
          <Text style={styles.label}>Precio por km</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={pricePerKm}
              onChangeText={setPricePerKm}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { width: 80 }]}
              value={currency}
              onChangeText={setCurrency}
              placeholder="CLP"
              placeholderTextColor="#999"
            />
          </View>
          
          <Text style={styles.label}>Precio base</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={basePrice}
              onChangeText={setBasePrice}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { width: 80 }]}
              value={currency}
              onChangeText={setCurrency}
              placeholder="CLP"
              placeholderTextColor="#999"
            />
          </View>
        </>
      )}
      
      {serviceType === 'professional' && (
        <>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.typeSelector}>
            {professionalCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.typeOption,
                  professionalCategory === cat && styles.typeOptionSelected
                ]}
                onPress={() => setProfessionalCategory(cat)}
              >
                <Text style={[
                  styles.typeOptionText,
                  professionalCategory === cat && styles.typeOptionTextSelected
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Precio por hora *</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={pricePerHour}
              onChangeText={setPricePerHour}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { width: 80 }]}
              value={currency}
              onChangeText={setCurrency}
              placeholder="CLP"
              placeholderTextColor="#999"
            />
          </View>
        </>
      )}
      
      <Text style={styles.label}>Fotos (opcional)</Text>
      <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImages}>
        <Text style={styles.imagePickerBtnText}>📷 Agregar fotos</Text>
      </TouchableOpacity>
      
      {imageUris.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.imagePreviewImg} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImageUris(imageUris.filter((_, i) => i !== index))}
              >
                <Text style={styles.removeImageBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? 'Publicando...' : 'Publicar servicio'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Create Accommodation Screen (Airbnb-like)
function CreateAccommodationScreen({ navigation }: any) {
  const { createService } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [currency, setCurrency] = useState('CLP');
  const [accommodationType, setAccommodationType] = useState<'casa_completa' | 'habitacion' | 'sofa' | 'departamento'>('casa_completa');
  const [maxGuests, setMaxGuests] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [beds, setBeds] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [houseRules, setHouseRules] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [minimumNights, setMinimumNights] = useState('');
  const [maximumNights, setMaximumNights] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [videoUris, setVideoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  
  const availableAmenities = [
    'WiFi', 'Aire acondicionado', 'Calefacción', 'Cocina', 'Lavadora', 
    'Secadora', 'TV', 'Estacionamiento', 'Piscina', 'Jardín', 
    'Balcón', 'Ascensor', 'Gimnasio', 'Mascotas permitidas'
  ];
  
  async function handlePickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a las imágenes');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImageUris([...imageUris, ...result.assets.map(a => a.uri)]);
    }
  }
  
  async function handlePickVideos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a los videos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setVideoUris([...videoUris, ...result.assets.map(a => a.uri)]);
    }
  }
  
  function toggleAmenity(amenity: string) {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  }
  
  async function handleCreate() {
    if (!title.trim() || !description.trim() || !pricePerNight.trim()) {
      alert('Completa los campos obligatorios: título, descripción y precio');
      return;
    }
    
    if (imageUris.length === 0) {
      alert('Agrega al menos una foto del alojamiento');
      return;
    }
    
    setLoading(true);
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat: number | undefined;
      let lon: number | undefined;
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      }
      
      await createService({
        service_type: 'accommodation',
        title: title.trim(),
        description: description.trim(),
        price_per_night: parseFloat(pricePerNight),
        currency,
        image_hashes: imageUris, // Will be converted to hashes in store
        video_hashes: videoUris, // Will be converted to hashes in store
        lat,
        lon,
        accommodation_type: accommodationType,
        max_guests: maxGuests ? parseInt(maxGuests) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        beds: beds ? parseInt(beds) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        house_rules: houseRules.trim() || undefined,
        cancellation_policy: cancellationPolicy.trim() || undefined,
        minimum_nights: minimumNights ? parseInt(minimumNights) : undefined,
        maximum_nights: maximumNights ? parseInt(maximumNights) : undefined,
        amenities,
      });
      
      alert('Alojamiento publicado exitosamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating accommodation:', error);
      alert('Error al publicar el alojamiento');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Publicar alojamiento</Text>
      
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Hermosa casa en el centro"
        placeholderTextColor="#999"
      />
      
      <Text style={styles.label}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe tu alojamiento..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
      />
      
      <Text style={styles.label}>Tipo de alojamiento *</Text>
      <View style={styles.typeSelector}>
        {(['casa_completa', 'habitacion', 'sofa', 'departamento'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeOption,
              accommodationType === type && styles.typeOptionSelected
            ]}
            onPress={() => setAccommodationType(type)}
          >
            <Text style={[
              styles.typeOptionText,
              accommodationType === type && styles.typeOptionTextSelected
            ]}>
              {type === 'casa_completa' ? '🏠 Casa completa' :
               type === 'habitacion' ? '🛏️ Habitación' :
               type === 'sofa' ? '🛋️ Sofá' : '🏢 Departamento'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.label}>Precio por noche *</Text>
      <View style={styles.priceRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          value={pricePerNight}
          onChangeText={setPricePerNight}
          placeholder="0"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <TextInput
          style={[styles.input, { width: 80 }]}
          value={currency}
          onChangeText={setCurrency}
          placeholder="CLP"
          placeholderTextColor="#999"
        />
      </View>
      
      <Text style={styles.label}>Capacidad</Text>
      <View style={styles.capacityRow}>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Huéspedes máx.</Text>
          <TextInput
            style={styles.capacityInput}
            value={maxGuests}
            onChangeText={setMaxGuests}
            placeholder="2"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Dormitorios</Text>
          <TextInput
            style={styles.capacityInput}
            value={bedrooms}
            onChangeText={setBedrooms}
            placeholder="1"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Camas</Text>
          <TextInput
            style={styles.capacityInput}
            value={beds}
            onChangeText={setBeds}
            placeholder="1"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Baños</Text>
          <TextInput
            style={styles.capacityInput}
            value={bathrooms}
            onChangeText={setBathrooms}
            placeholder="1"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
      </View>
      
      <Text style={styles.label}>Horarios</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Check-in</Text>
          <TextInput
            style={styles.timeInput}
            value={checkInTime}
            onChangeText={setCheckInTime}
            placeholder="14:00"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Check-out</Text>
          <TextInput
            style={styles.timeInput}
            value={checkOutTime}
            onChangeText={setCheckOutTime}
            placeholder="11:00"
            placeholderTextColor="#999"
          />
        </View>
      </View>
      
      <Text style={styles.label}>Noches</Text>
      <View style={styles.nightsRow}>
        <View style={styles.nightsItem}>
          <Text style={styles.nightsLabel}>Mínimas</Text>
          <TextInput
            style={styles.nightsInput}
            value={minimumNights}
            onChangeText={setMinimumNights}
            placeholder="1"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.nightsItem}>
          <Text style={styles.nightsLabel}>Máximas</Text>
          <TextInput
            style={styles.nightsInput}
            value={maximumNights}
            onChangeText={setMaximumNights}
            placeholder="30"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
      </View>
      
      <Text style={styles.label}>Amenidades</Text>
      <View style={styles.amenitiesGrid}>
        {availableAmenities.map((amenity) => (
          <TouchableOpacity
            key={amenity}
            style={[
              styles.amenityChip,
              amenities.includes(amenity) && styles.amenityChipSelected
            ]}
            onPress={() => toggleAmenity(amenity)}
          >
            <Text style={[
              styles.amenityChipText,
              amenities.includes(amenity) && styles.amenityChipTextSelected
            ]}>
              {amenities.includes(amenity) ? '✓ ' : ''}{amenity}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.label}>Reglas de la casa</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={houseRules}
        onChangeText={setHouseRules}
        placeholder="Ej: No fumar, No fiestas, Mascotas permitidas..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />
      
      <Text style={styles.label}>Política de cancelación</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={cancellationPolicy}
        onChangeText={setCancellationPolicy}
        placeholder="Ej: Cancelación gratuita hasta 24h antes..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={2}
      />
      
      <Text style={styles.label}>Fotos * (mínimo 1)</Text>
      <TouchableOpacity style={styles.mediaButton} onPress={handlePickImages}>
        <Text style={styles.mediaButtonText}>📷 Agregar fotos</Text>
      </TouchableOpacity>
      {imageUris.length > 0 && (
        <View style={styles.mediaPreviewContainer}>
          <FlatList
            horizontal
            data={imageUris}
            renderItem={({ item, index }) => (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: item }} style={styles.mediaPreviewImg} />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => setImageUris(imageUris.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeMediaBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(_, index) => `img_${index}`}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
      
      <Text style={styles.label}>Videos (opcional)</Text>
      <TouchableOpacity style={styles.mediaButton} onPress={handlePickVideos}>
        <Text style={styles.mediaButtonText}>🎥 Agregar videos</Text>
      </TouchableOpacity>
      {videoUris.length > 0 && (
        <View style={styles.mediaPreviewContainer}>
          <FlatList
            horizontal
            data={videoUris}
            renderItem={({ item, index }) => (
              <View style={styles.mediaPreview}>
                <Video source={{ uri: item }} style={styles.mediaPreviewVideo} useNativeControls resizeMode="contain" />
                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => setVideoUris(videoUris.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeMediaBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(_, index) => `vid_${index}`}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? 'Publicando...' : 'Publicar alojamiento'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProductDetailScreen({ route, navigation }: any) {
  const { product } = route.params;
  const currentUser = useAuthStore((s) => s.currentUser);
  const { sendMessage, commentOnProduct, getProductComments } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  useEffect(() => {
    loadComments();
  }, [product.id]);
  
  async function loadComments() {
    if (!product.hash) return;
    setLoadingComments(true);
    try {
      const productComments = await getProductComments(product.hash);
      setComments(productComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }
  
  async function handleComment() {
    if (!commentText.trim() || !product.hash) return;
    
    try {
      await commentOnProduct(product.hash, commentText.trim());
      setCommentText('');
      loadComments();
    } catch (error) {
      console.error('Error commenting:', error);
      alert('Error al comentar');
    }
  }
  
  async function handleContactSeller() {
    if (!currentUser || !product.sellerId) return;
    
    try {
      // Navigate to chat with seller
      navigation.navigate('Chat', {
        userId: product.sellerId,
        userName: product.sellerName || 'Vendedor',
      });
      
      // Send initial message about the product
      await sendMessage(
        product.sellerId,
        `Hola, me interesa el producto "${product.title}"`
      );
    } catch (error) {
      console.error('Error contacting seller:', error);
      alert('Error al contactar vendedor');
    }
  }
  
  return (
    <ScrollView style={styles.container}>
      {product.images && product.images.length > 0 && (
        <FlatList
          horizontal
          data={product.images}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.productDetailImage} />
          )}
          keyExtractor={(item, idx) => `img_${idx}`}
          showsHorizontalScrollIndicator={false}
        />
      )}
      
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.productPrice}>${product.price.toLocaleString()} {product.currency}</Text>
      
      <View style={styles.productSellerInfo}>
        <Text style={styles.productSellerLabel}>Vendedor:</Text>
        <Text style={styles.productSellerName}>{product.sellerName || 'Usuario'}</Text>
      </View>
      
      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.descriptionText}>{product.description}</Text>
      </View>
      
      {product.lat && product.lon && (
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <Text style={styles.locationText}>
            📍 {product.lat.toFixed(4)}, {product.lon.toFixed(4)}
          </Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.primaryBtn} onPress={handleContactSeller}>
        <Text style={styles.primaryBtnText}>💬 Contactar vendedor</Text>
      </TouchableOpacity>
      
      <View style={styles.commentsSection}>
        <TouchableOpacity
          style={styles.commentsHeader}
          onPress={() => setShowComments(!showComments)}
        >
          <Text style={styles.sectionTitle}>
            💬 Comentarios ({comments.length})
          </Text>
          <Text>{showComments ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {showComments && (
          <>
            {loadingComments ? (
              <Text>Cargando comentarios...</Text>
            ) : comments.length === 0 ? (
              <Text style={styles.emptyComments}>No hay comentarios aún</Text>
            ) : (
              comments.map((comment, idx) => (
                <View key={idx} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{comment.author_name || 'Usuario'}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(comment.created_at * 1000).toLocaleDateString('es-CL')}
                  </Text>
                </View>
              ))
            )}
            
            {currentUser && (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Escribe un comentario..."
                  placeholderTextColor="#999"
                  multiline
                />
                <TouchableOpacity style={styles.commentSendBtn} onPress={handleComment}>
                  <Text style={styles.commentSendBtnText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function ServiceDetailScreen({ route, navigation }: any) {
  const { service } = route.params;
  
  const getPriceText = () => {
    if (service.pricePerKm) return `$${service.pricePerKm.toLocaleString()}/km ${service.currency}`;
    if (service.pricePerNight) return `$${service.pricePerNight.toLocaleString()}/noche ${service.currency}`;
    if (service.pricePerHour) return `$${service.pricePerHour.toLocaleString()}/hora ${service.currency}`;
    if (service.basePrice) return `$${service.basePrice.toLocaleString()} base ${service.currency}`;
    return 'Consultar precio';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{service.title}</Text>
      
      {service.type === 'room_rental' && (
        <View style={styles.roomDetailsSection}>
          {service.roomImages && service.roomImages.length > 0 ? (
            <FlatList
              horizontal
              data={service.roomImages}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.roomDetailImage} />
              )}
              keyExtractor={(item, index) => `img_${index}`}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <View style={styles.roomImagePlaceholder}>
              <Text style={styles.roomImagePlaceholderText}>🏠</Text>
            </View>
          )}
          
          {service.roomCapacity && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Capacidad:</Text>
              <Text style={styles.detailValue}>👥 {service.roomCapacity} personas</Text>
            </View>
          )}
          
          {service.amenities && service.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Amenidades:</Text>
              <View style={styles.amenitiesList}>
                {service.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>✓ {amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {service.type === 'professional' && service.professionalCategory && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Categoría:</Text>
          <Text style={styles.detailValue}>💼 {service.professionalCategory}</Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Precio:</Text>
        <Text style={[styles.detailValue, styles.priceHighlight]}>{getPriceText()}</Text>
      </View>

      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.descriptionText}>{service.description}</Text>
      </View>

      {service.lat && service.lon && (
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <Text style={styles.locationText}>
            📍 {service.lat.toFixed(4)}, {service.lon.toFixed(4)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('Chat', {
          userId: service.providerId,
          userName: 'Proveedor',
        })}
      >
        <Text style={styles.primaryBtnText}>💬 Contactar proveedor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => {}}
      >
        <Text style={styles.secondaryBtnText}>
          {service.type === 'room_rental' ? '📅 Reservar habitación' : '✅ Solicitar servicio'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function UserOptionsScreen({ route, navigation }: any) {
  const { user } = route.params;
  const { reportUser, muteUser, unmuteUser, hideUser, unhideUser, mutedUsers, hiddenUsers } = useAuthStore();
  const isMuted = mutedUsers.has(user.id);
  const isHidden = hiddenUsers.has(user.id);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  function handleReport() {
    if (reportReason.trim()) {
      reportUser(user.id, reportReason);
      setShowReportModal(false);
      setReportReason('');
      navigation.goBack();
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userHeader}>
        {user.idPhotoUri ? (
          <Image source={{ uri: user.idPhotoUri }} style={styles.userHeaderPhoto} />
        ) : (
          <View style={[styles.userHeaderPhoto, { backgroundColor: '#ddd' }]} />
        )}
        <Text style={styles.userHeaderName}>{user.name}</Text>
        {user.isVerified && <Text style={styles.verifiedText}>✓ Verificado</Text>}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Chat', { userId: user.id, userName: user.name })}
        >
          <Text style={styles.actionButtonText}>💬 Enviar mensaje</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={async () => {
            await useAuthStore.getState().blockUser(user.id);
            navigation.goBack();
          }}
        >
          <Text style={styles.actionButtonSecondaryText}>🚫 Bloquear usuario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('VideoCall', { userId: user.id, userName: user.name })}
        >
          <Text style={styles.actionButtonText}>📹 Video llamada</Text>
        </TouchableOpacity>

        {isMuted ? (
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => unmuteUser(user.id)}
          >
            <Text style={styles.actionButtonSecondaryText}>🔊 Desilenciar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => muteUser(user.id)}
          >
            <Text style={styles.actionButtonSecondaryText}>🔇 Silenciar</Text>
          </TouchableOpacity>
        )}

        {isHidden ? (
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => unhideUser(user.id)}
          >
            <Text style={styles.actionButtonSecondaryText}>👁️ Mostrar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => hideUser(user.id)}
          >
            <Text style={styles.actionButtonSecondaryText}>🙈 Ocultar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButtonDanger}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={styles.actionButtonDangerText}>⚠️ Reportar</Text>
        </TouchableOpacity>
      </View>

      {showReportModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reportar usuario</Text>
            <TextInput
              placeholder="Razón del reporte..."
              value={reportReason}
              onChangeText={setReportReason}
              style={styles.input}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleReport}>
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Reportar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// Chats List Screen
function ChatsScreen({ navigation }: any) {
  const { chats, loadingChats, loadChats } = useAuthStore();
  
  useEffect(() => {
    loadChats();
    // Refresh chats periodically
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, [loadChats]);
  
  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.userId}
        refreshing={loadingChats}
        onRefresh={loadChats}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', { userId: item.userId, userName: item.userName })}
          >
            <View style={styles.chatItemAvatar}>
              <Text style={styles.chatItemAvatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.chatItemContent}>
              <View style={styles.chatItemHeader}>
                <Text style={styles.chatItemName}>{item.userName}</Text>
                {item.lastMessage && (
                  <Text style={styles.chatItemTime}>
                    {new Date(item.lastMessage.timestamp * 1000).toLocaleTimeString('es-CL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                )}
              </View>
              {item.lastMessage && (
                <Text style={styles.chatItemPreview} numberOfLines={1}>
                  {item.lastMessage.type === 'image' ? '📷 Imagen' :
                   item.lastMessage.type === 'video' ? '🎥 Video' :
                   item.lastMessage.text || 'Mensaje'}
                </Text>
              )}
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {loadingChats ? 'Cargando conversaciones...' : 'No tienes conversaciones aún'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ChatScreen({ route, navigation }: any) {
  const { userId, userName } = route.params;
  const currentUser = useAuthStore((s) => s.currentUser);
  const { messages, sendMessage, loadMessages, markMessageRead } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  
  const chatId = useMemo(() => {
    if (!currentUser) return '';
    const ids = [currentUser.id, userId].sort();
    return `chat_${ids[0]}_${ids[1]}`;
  }, [currentUser, userId]);
  
  const chatMessages = messages[chatId] || [];
  
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    }
  }, [chatId, loadMessages]);
  
  // Mark messages as read when viewing
  useEffect(() => {
    chatMessages.forEach(msg => {
      if (!msg.read && msg.receiverId === currentUser?.id && msg.hash) {
        markMessageRead(msg.hash);
      }
    });
  }, [chatMessages, currentUser, markMessageRead]);
  
  async function handleSendText() {
    if (!messageText.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage(userId, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  }
  
  async function handleSendImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled && !sending) {
      setSending(true);
      try {
        await sendMessage(userId, undefined, result.assets[0].uri);
      } catch (error) {
        console.error('Error sending image:', error);
        alert('Error al enviar imagen');
      } finally {
        setSending(false);
      }
    }
  }
  
  async function handleSendVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    
    if (!result.canceled && !sending) {
      setSending(true);
      try {
        await sendMessage(userId, undefined, undefined, result.assets[0].uri);
      } catch (error) {
        console.error('Error sending video:', error);
        alert('Error al enviar video');
      } finally {
        setSending(false);
      }
    }
  }

  return (
    <View style={styles.chatContainer}>
      <FlatList
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.senderId === currentUser?.id;
          return (
            <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
              {item.type === 'image' && item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
              ) : (
                <Text style={isMe ? styles.messageTextMe : styles.messageTextOther}>{item.text}</Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.chatMessages}
      />
      <View style={styles.chatInput}>
        <TouchableOpacity style={styles.chatButton} onPress={handleSendImage}>
          <Text style={styles.chatButtonText}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} onPress={handleSendVideo}>
          <Text style={styles.chatButtonText}>🎥</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.chatInputField}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSendText}
        />
        <TouchableOpacity 
          style={[styles.chatButton, sending && styles.chatButtonDisabled]} 
          onPress={handleSendText}
          disabled={sending}
        >
          <Text style={styles.chatButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VideoCallScreen({ route, navigation }: any) {
  const { userName } = route.params;
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <View style={styles.videoCallContainer}>
      <View style={styles.videoCallRemote}>
        <Text style={styles.videoCallText}>{userName}</Text>
        <Text style={styles.videoCallStatus}>{isCallActive ? 'Llamada en curso' : 'Llamada finalizada'}</Text>
      </View>
      
      <View style={styles.videoCallLocal}>
        <Text style={styles.videoCallText}>Tú</Text>
      </View>

      <View style={styles.videoCallControls}>
        <TouchableOpacity
          style={[styles.videoCallButton, isMuted && styles.videoCallButtonActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Text style={styles.videoCallButtonText}>{isMuted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.videoCallButton, styles.videoCallButtonDanger]}
          onPress={() => {
            setIsCallActive(false);
            navigation.goBack();
          }}
        >
          <Text style={styles.videoCallButtonText}>📞</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.videoCallButton, isVideoOff && styles.videoCallButtonActive]}
          onPress={() => setIsVideoOff(!isVideoOff)}
        >
          <Text style={styles.videoCallButtonText}>{isVideoOff ? '📹' : '📷'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Verified Badge Component
function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <View style={[styles.verifiedBadge, { width: size, height: size }]}>
      <Text style={[styles.verifiedBadgeText, { fontSize: size * 0.6 }]}>✓</Text>
    </View>
  );
}

// User Name with Verified Badge
function UserNameWithBadge({ name, isVerified, style }: { name: string; isVerified: boolean; style?: any }) {
  return (
    <View style={[styles.userNameContainer, style]}>
      <Text style={styles.userNameText}>{name}</Text>
      {isVerified && <VerifiedBadge size={16} />}
    </View>
  );
}

// Feed Screen - Muro central
function FeedScreen({ navigation }: any) {
  const { feed, loadingFeed, loadFeed, createPost, clapPost, likePost, unlikePost, commentPost, reportPost, activeBanner, loadActiveBanner, recordBannerClick } = useAuthStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFeed();
    loadActiveBanner();
  }, [loadFeed, loadActiveBanner]);
  
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.wishesHeaderBtn}
          onPress={() => navigation.navigate('Wishes')}
        >
          <Text style={styles.wishesHeaderBtnText}>⭐</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  async function handleBannerPress() {
    if (activeBanner && activeBanner.hash) {
      await recordBannerClick(activeBanner.hash);
      if (activeBanner.link_url) {
        const supported = await Linking.canOpenURL(activeBanner.link_url);
        if (supported) {
          await Linking.openURL(activeBanner.link_url);
        } else {
          Alert.alert('Error', 'No se puede abrir este enlace');
        }
      }
    }
  }

  const renderPost = ({ item }: { item: Post }) => {
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [clapCount, setClapCount] = useState(item.claps || 0);
    const [likeCount, setLikeCount] = useState(item.likes || 0);
    const [isLiked, setIsLiked] = useState(item.userLiked || false);
    const [showComments, setShowComments] = useState(false);
    
    const handleClap = async () => {
      if (!item.hash) return;
      try {
        await clapPost(item.hash, 1);
        setClapCount(clapCount + 1);
      } catch (error) {
        console.error('Error clapping:', error);
      }
    };
    
    const handleLike = async () => {
      if (!item.hash) return;
      try {
        if (isLiked) {
          await unlikePost(item.hash);
          setLikeCount(likeCount - 1);
          setIsLiked(false);
        } else {
          await likePost(item.hash);
          setLikeCount(likeCount + 1);
          setIsLiked(true);
        }
      } catch (error) {
        console.error('Error liking:', error);
      }
    };
    
    const handleReport = async (reason: string) => {
      if (!item.hash) return;
      try {
        await reportPost(item.hash, reason);
        alert('Publicación reportada. Gracias por mantener la comunidad segura.');
        setShowReportMenu(false);
      } catch (error) {
        console.error('Error reporting:', error);
        alert('Error al reportar');
      }
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postAuthor}>
            {item.imageUris && item.imageUris.length > 0 ? (
              <Image source={{ uri: item.imageUris[0] }} style={styles.postAuthorAvatar} />
            ) : (
              <View style={[styles.postAuthorAvatar, { backgroundColor: '#ddd' }]} />
            )}
            <View>
              <UserNameWithBadge 
                name={item.authorName || 'Usuario'} 
                isVerified={item.authorIsVerified || false}
                style={styles.postAuthorNameContainer}
              />
              <Text style={styles.postTime}>
                {new Date(item.createdAt * 1000).toLocaleDateString('es-CL')}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowReportMenu(!showReportMenu)}>
            <Text style={styles.moreButton}>⋯</Text>
          </TouchableOpacity>
        </View>
        
        {showReportMenu && (
          <View style={styles.reportMenu}>
            <TouchableOpacity onPress={() => handleReport('spam')}>
              <Text style={styles.reportMenuItem}>Spam</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReport('inappropriate')}>
              <Text style={styles.reportMenuItem}>Contenido inapropiado</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReport('violence')}>
              <Text style={styles.reportMenuItem}>Violencia</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReport('harassment')}>
              <Text style={styles.reportMenuItem}>Acoso</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowReportMenu(false)}>
              <Text style={styles.reportMenuItemCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {item.text && <Text style={styles.postText}>{item.text}</Text>}
        
        {item.videoUri ? (
          <Video
            source={{ uri: item.videoUri }}
            style={styles.postVideo}
            useNativeControls
            resizeMode="contain"
          />
        ) : item.imageUris && item.imageUris.length > 0 && (
          <View style={styles.postImages}>
            {item.imageUris.map((uri, idx) => (
              <View key={idx} style={styles.postImageContainer}>
                <Image source={{ uri }} style={styles.postImage} />
                {item.stickerData && item.stickerData
                  .filter(s => s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1)
                  .map((sticker, sIdx) => (
                    <View
                      key={sIdx}
                      style={[
                        styles.stickerOverlay,
                        {
                          left: `${sticker.x * 100}%`,
                          top: `${sticker.y * 100}%`,
                          transform: [
                            { scale: sticker.scale || 1 },
                            { rotate: `${sticker.rotation || 0}deg` },
                          ],
                        },
                      ]}
                    >
                      <Text style={[styles.stickerText, { fontSize: 24 * (sticker.scale || 1) }]}>
                        {sticker.content}
                      </Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}
        
        {item.location && (
          <Text style={styles.postLocation}>📍 {item.location.address || 'Ubicación'}</Text>
        )}
        
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.postActionBtn} onPress={handleClap}>
            <Text style={styles.postActionIcon}>👏</Text>
            <Text style={styles.postActionCount}>{clapCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.postActionBtn} onPress={handleLike}>
            <Text style={[styles.postActionIcon, isLiked && styles.postActionIconActive]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.postActionCount}>{likeCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.postActionBtn} 
            onPress={() => setShowComments(!showComments)}
          >
            <Text style={styles.postActionIcon}>💬</Text>
            <Text style={styles.postActionCount}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>
        
        {showComments && (
          <View style={styles.commentsSection}>
            {item.comments?.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <UserNameWithBadge 
                  name={comment.authorName || 'Usuario'} 
                  isVerified={comment.authorIsVerified || false}
                />
                <Text style={styles.commentText}>{comment.text}</Text>
                {comment.replies && comment.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {comment.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <UserNameWithBadge 
                          name={reply.authorName || 'Usuario'} 
                          isVerified={false}
                        />
                        <Text style={styles.commentText}>{reply.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity onPress={() => {
                  const parentHash = comment.hash;
                  const text = commentTexts[`reply_${parentHash}`] || '';
                  if (text.trim()) {
                    commentPost(item.hash!, text, parentHash);
                    setCommentTexts({ ...commentTexts, [`reply_${parentHash}`]: '' });
                  }
                }}>
                  <Text style={styles.replyButton}>Responder</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Escribe un comentario..."
                value={commentTexts[item.id] || ''}
                onChangeText={(text) => setCommentTexts({ ...commentTexts, [item.id]: text })}
              />
              <TouchableOpacity
                onPress={() => {
                  const text = commentTexts[item.id];
                  if (text && text.trim() && item.hash) {
                    commentPost(item.hash, text);
                    setCommentTexts({ ...commentTexts, [item.id]: '' });
                  }
                }}
              >
                <Text style={styles.sendCommentButton}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createBtnText}>+ Crear publicación</Text>
        </TouchableOpacity>
      </View>
      
      {/* Ad Banner */}
      {activeBanner && (
        <TouchableOpacity
          style={styles.adBanner}
          onPress={handleBannerPress}
          activeOpacity={0.8}
        >
          {activeBanner.image_hash ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${activeBanner.image_hash}` }}
              style={styles.adBannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.adBannerPlaceholder}>
              <Text style={styles.adBannerText}>{activeBanner.title}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      
      <FlatList
        data={feed}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContainer}
        refreshing={loadingFeed}
        onRefresh={loadFeed}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {loadingFeed ? 'Cargando muro...' : 'Aún no hay publicaciones. Sé el primero en publicar!'}
            </Text>
          </View>
        }
      />
      
      {/* Floating Action Button for Wishes */}
      <TouchableOpacity
        style={styles.fabWishes}
        onPress={() => navigation.navigate('Wishes')}
      >
        <Text style={styles.fabWishesText}>⭐</Text>
      </TouchableOpacity>
    </View>
  );
}

// Create Post Screen
function CreatePostScreen({ navigation }: any) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [stickers, setStickers] = useState<any[]>([]);
  const [editingMedia, setEditingMedia] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number; address?: string } | null>(null);
  const { createPost } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          address: address ? `${address.street}, ${address.city}` : undefined,
        });
      }
    })();
  }, []);

  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    
    // Show action sheet to choose between photo and video
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 0.8,
      videoQuality: ImagePicker.VideoQuality.Medium,
    });
    
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.type === 'video') {
        setVideo(asset.uri);
        setEditingMedia(asset.uri);
      } else {
        setImages([...images, asset.uri]);
        setEditingMedia(asset.uri);
      }
    }
  }

  function addSticker(stickerType: 'emoji' | 'text', content: string) {
    if (!editingMedia) return;
    
    const newSticker = {
      stickerType,
      content,
      x: 0.5, // Center
      y: 0.5, // Center
      scale: 1,
      rotation: 0,
    };
    
    setStickers([...stickers, newSticker]);
  }

  async function handleSubmit() {
    if (!text.trim() && images.length === 0 && !video) return;
    
    setLoading(true);
    try {
      await createPost(text.trim() || null, images, video, stickers, location || undefined);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear publicación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Nueva publicación</Text>
      
      <TextInput
        style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
        placeholder="¿Qué quieres compartir?"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={6}
      />
      
      <TouchableOpacity style={styles.secondaryBtn} onPress={pickMedia}>
        <Text style={styles.secondaryBtnText}>📷 Agregar foto/video</Text>
      </TouchableOpacity>
      
      {(images.length > 0 || video) && (
        <View style={styles.mediaPreviewContainer}>
          {video && (
            <View style={styles.mediaPreview}>
              <Video
                source={{ uri: video }}
                style={styles.mediaPreviewVideo}
                useNativeControls
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.removeMediaBtn}
                onPress={() => {
                  setVideo(null);
                  setEditingMedia(null);
                }}
              >
                <Text style={styles.removeMediaBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {images.map((uri, idx) => (
            <View key={idx} style={styles.mediaPreview}>
              <Image source={{ uri }} style={styles.mediaPreviewImg} />
              <TouchableOpacity
                style={styles.removeMediaBtn}
                onPress={() => {
                  const newImages = images.filter((_, i) => i !== idx);
                  setImages(newImages);
                  if (newImages.length === 0) setEditingMedia(null);
                }}
              >
                <Text style={styles.removeMediaBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {editingMedia && (
        <View style={styles.stickersSection}>
          <Text style={styles.stickersTitle}>Agregar stickers</Text>
          <View style={styles.stickersGrid}>
            {['😀', '❤️', '🔥', '👍', '🎉', '💯', '⭐', '🎈'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.stickerBtn}
                onPress={() => addSticker('emoji', emoji)}
              >
                <Text style={styles.stickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {location && (
        <Text style={styles.locationText}>
          📍 {location.address || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
        </Text>
      )}
      
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? 'Publicando...' : 'Publicar'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Tamagochi Screen
function TamagochiScreen({ navigation }: any) {
  const { tamagochi, createTamagochi, feedTamagochi, cleanTamagochi, playWithTamagochi, killTamagochi, updateTamagochiState, loadingTamagochi, loadTamagochi } = useAuthStore();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  
  useEffect(() => {
    loadTamagochi();
    if (tamagochi && tamagochi.isAlive) {
      // Auto-update state and auto-feed when opening
      updateTamagochiState().then(() => {
        if (tamagochi.isAlive) {
          feedTamagochi().catch(console.error); // Auto-feed on entry
        }
      }).catch(console.error);
    }
  }, []);
  
  // Auto-update every minute
  useEffect(() => {
    if (!tamagochi || !tamagochi.isAlive) return;
    
    const interval = setInterval(() => {
      updateTamagochiState();
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [tamagochi, updateTamagochiState]);
  
  async function handleCreate() {
    if (!name.trim()) {
      alert('Ingresa un nombre para tu tamagochi');
      return;
    }
    
    setCreating(true);
    try {
      await createTamagochi(name.trim());
      setName('');
    } catch (error) {
      console.error('Error creating tamagochi:', error);
      alert('Error al crear tamagochi');
    } finally {
      setCreating(false);
    }
  }
  
  async function handleKill() {
    if (!confirm(`¿Estás seguro de que quieres matar a ${tamagochi?.name}?`)) {
      return;
    }
    
    try {
      await killTamagochi();
      alert(`${tamagochi?.name} ha muerto. Una cruz aparecerá en tu perfil.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error killing tamagochi:', error);
      alert('Error al matar tamagochi');
    }
  }
  
  if (!tamagochi) {
    return (
      <View style={styles.tamagochiScreen}>
        <Text style={styles.title}>Crear Tamagochi</Text>
        <Text style={styles.infoCardText}>
          Tu tamagochi crecerá cada vez que entres a la app y comerá automáticamente.
          Cuídalo alimentándolo, limpiándolo y jugando con él.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nombre de tu tamagochi"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity
          style={[styles.primaryBtn, (!name.trim() || creating) && styles.primaryBtnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || creating}
        >
          <Text style={styles.primaryBtnText}>
            {creating ? 'Creando...' : '🥚 Crear Huevo'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!tamagochi.isAlive) {
    return (
      <View style={styles.tamagochiScreen}>
        <Text style={styles.title}>💀 {tamagochi.name} ha muerto</Text>
        <Text style={styles.infoCardText}>
          Tu tamagochi ha fallecido. Una cruz aparecerá en tu perfil en memoria.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            setName('');
            navigation.goBack();
          }}
        >
          <Text style={styles.primaryBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const getTamagochiEmoji = () => {
    switch (tamagochi.stage) {
      case 'egg': return '🥚';
      case 'baby': return '👶';
      case 'child': return '🧒';
      case 'teen': return '🧑';
      case 'adult': return '👤';
      default: return '🥚';
    }
  };
  
  const getBarColor = (value: number) => {
    if (value > 70) return '#28a745';
    if (value > 40) return '#ffc107';
    return '#dc3545';
  };
  
  return (
    <ScrollView style={styles.tamagochiScreen}>
      <View style={styles.tamagochiDisplay}>
        <Text style={styles.tamagochiEmoji}>{getTamagochiEmoji()}</Text>
        <Text style={styles.tamagochiName}>{tamagochi.name}</Text>
        <Text style={styles.tamagochiStage}>
          {tamagochi.stage === 'egg' ? '🥚 Huevo - Nivel ' + tamagochi.level :
           tamagochi.stage === 'baby' ? '👶 Bebé - Nivel ' + tamagochi.level :
           tamagochi.stage === 'child' ? '🧒 Niño - Nivel ' + tamagochi.level :
           tamagochi.stage === 'teen' ? '🧑 Adolescente - Nivel ' + tamagochi.level :
           '👤 Adulto - Nivel ' + tamagochi.level}
        </Text>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>⚡ Energía</Text>
            <Text>{tamagochi.energy}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.energy}%`, backgroundColor: getBarColor(tamagochi.energy) }]} />
          </View>
        </View>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>🍖 Hambre</Text>
            <Text>{tamagochi.hunger}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.hunger}%`, backgroundColor: getBarColor(tamagochi.hunger) }]} />
          </View>
        </View>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>🧼 Higiene</Text>
            <Text>{tamagochi.hygiene}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.hygiene}%`, backgroundColor: getBarColor(tamagochi.hygiene) }]} />
          </View>
        </View>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>😊 Felicidad</Text>
            <Text>{tamagochi.happiness}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.happiness}%`, backgroundColor: getBarColor(tamagochi.happiness) }]} />
          </View>
        </View>
        
        <Text style={styles.tamagochiStat}>⭐ Experiencia: {tamagochi.experience}</Text>
      </View>
      
      <View style={styles.tamagochiActions}>
        <TouchableOpacity
          style={styles.tamagochiActionBtn}
          onPress={feedTamagochi}
        >
          <Text style={{ fontSize: 32 }}>🍖</Text>
          <Text style={styles.tamagochiActionBtnText}>Alimentar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tamagochiActionBtn}
          onPress={cleanTamagochi}
        >
          <Text style={{ fontSize: 32 }}>🧼</Text>
          <Text style={styles.tamagochiActionBtnText}>Limpiar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tamagochiActionBtn}
          onPress={playWithTamagochi}
        >
          <Text style={{ fontSize: 32 }}>🎮</Text>
          <Text style={styles.tamagochiActionBtnText}>Jugar</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.tamagochiKillBtn}
        onPress={handleKill}
      >
        <Text style={styles.tamagochiKillBtnText}>💀 Matar Tamagochi</Text>
      </TouchableOpacity>
      
      <Text style={styles.infoCardText}>
        💡 Tu tamagochi crece automáticamente cada vez que abres la app y se alimenta solo.
        Si no lo visitas por varios días, su energía bajará.
      </Text>
    </ScrollView>
  );
}

// Tamagochi Screen
function TamagochiScreen({ navigation }: any) {
  const { tamagochi, createTamagochi, feedTamagochi, cleanTamagochi, playWithTamagochi, killTamagochi, updateTamagochiState, loadingTamagochi, loadTamagochi } = useAuthStore();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  
  useEffect(() => {
    loadTamagochi();
    if (tamagochi && tamagochi.isAlive) {
      // Auto-update state and auto-feed when opening
      updateTamagochiState().then(() => {
        if (tamagochi.isAlive) {
          feedTamagochi().catch(console.error); // Auto-feed on entry
        }
      }).catch(console.error);
    }
  }, []);
  
  // Auto-update every minute
  useEffect(() => {
    if (!tamagochi || !tamagochi.isAlive) return;
    
    const interval = setInterval(() => {
      updateTamagochiState();
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [tamagochi, updateTamagochiState]);
  
  async function handleCreate() {
    if (!name.trim()) {
      alert('Ingresa un nombre para tu tamagochi');
      return;
    }
    
    setCreating(true);
    try {
      await createTamagochi(name.trim());
      setName('');
    } catch (error) {
      console.error('Error creating tamagochi:', error);
      alert('Error al crear tamagochi');
    } finally {
      setCreating(false);
    }
  }
  
  async function handleKill() {
    if (!tamagochi) return;
    
    // Use Alert instead of confirm for React Native
    Alert.alert(
      'Matar Tamagochi',
      `¿Estás seguro de que quieres matar a ${tamagochi.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Matar',
          style: 'destructive',
          onPress: async () => {
            try {
              await killTamagochi();
              Alert.alert('Tamagochi muerto', `${tamagochi.name} ha muerto. Una cruz aparecerá en tu perfil.`);
              navigation.goBack();
            } catch (error) {
              console.error('Error killing tamagochi:', error);
              Alert.alert('Error', 'Error al matar tamagochi');
            }
          },
        },
      ]
    );
  }
  
  if (!tamagochi) {
    return (
      <View style={styles.tamagochiScreen}>
        <Text style={styles.title}>Crear Tamagochi</Text>
        <Text style={styles.infoCardText}>
          Tu tamagochi crecerá cada vez que entres a la app y comerá automáticamente.
          Cuídalo alimentándolo, limpiándolo y jugando con él.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nombre de tu tamagochi"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity
          style={[styles.primaryBtn, (!name.trim() || creating) && styles.primaryBtnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || creating}
        >
          <Text style={styles.primaryBtnText}>
            {creating ? 'Creando...' : '🥚 Crear Huevo'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!tamagochi.isAlive) {
    return (
      <View style={styles.tamagochiScreen}>
        <Text style={styles.title}>💀 {tamagochi.name} ha muerto</Text>
        <Text style={styles.infoCardText}>
          Tu tamagochi ha fallecido. Una cruz aparecerá en tu perfil en memoria.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            setName('');
            navigation.goBack();
          }}
        >
          <Text style={styles.primaryBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const getTamagochiEmoji = () => {
    switch (tamagochi.stage) {
      case 'egg': return '🥚';
      case 'baby': return '👶';
      case 'child': return '🧒';
      case 'teen': return '🧑';
      case 'adult': return '👤';
      default: return '🥚';
    }
  };
  
  const getBarColor = (value: number) => {
    if (value > 70) return '#28a745';
    if (value > 40) return '#ffc107';
    return '#dc3545';
  };
  
  return (
    <ScrollView style={styles.tamagochiScreen}>
      <View style={styles.tamagochiDisplay}>
        <Text style={styles.tamagochiEmoji}>{getTamagochiEmoji()}</Text>
        <Text style={styles.tamagochiName}>{tamagochi.name}</Text>
        <Text style={styles.tamagochiStage}>
          {tamagochi.stage === 'egg' ? '🥚 Huevo - Nivel ' + tamagochi.level :
           tamagochi.stage === 'baby' ? '👶 Bebé - Nivel ' + tamagochi.level :
           tamagochi.stage === 'child' ? '🧒 Niño - Nivel ' + tamagochi.level :
           tamagochi.stage === 'teen' ? '🧑 Adolescente - Nivel ' + tamagochi.level :
           '👤 Adulto - Nivel ' + tamagochi.level}
        </Text>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>⚡ Energía</Text>
            <Text>{tamagochi.energy}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.energy}%`, backgroundColor: getBarColor(tamagochi.energy) }]} />
          </View>
        </View>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>🍖 Hambre</Text>
            <Text>{tamagochi.hunger}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.hunger}%`, backgroundColor: getBarColor(tamagochi.hunger) }]} />
          </View>
        </View>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>🧼 Higiene</Text>
            <Text>{tamagochi.hygiene}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.hygiene}%`, backgroundColor: getBarColor(tamagochi.hygiene) }]} />
          </View>
        </View>
        
        <View style={styles.tamagochiBars}>
          <View style={styles.tamagochiBarLabel}>
            <Text>😊 Felicidad</Text>
            <Text>{tamagochi.happiness}%</Text>
          </View>
          <View style={styles.tamagochiBar}>
            <View style={[styles.tamagochiBarFill, { width: `${tamagochi.happiness}%`, backgroundColor: getBarColor(tamagochi.happiness) }]} />
          </View>
        </View>
        
        <Text style={styles.tamagochiStat}>⭐ Experiencia: {tamagochi.experience}</Text>
      </View>
      
      <View style={styles.tamagochiActions}>
        <TouchableOpacity
          style={styles.tamagochiActionBtn}
          onPress={feedTamagochi}
        >
          <Text style={{ fontSize: 32 }}>🍖</Text>
          <Text style={styles.tamagochiActionBtnText}>Alimentar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tamagochiActionBtn}
          onPress={cleanTamagochi}
        >
          <Text style={{ fontSize: 32 }}>🧼</Text>
          <Text style={styles.tamagochiActionBtnText}>Limpiar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.tamagochiActionBtn}
          onPress={playWithTamagochi}
        >
          <Text style={{ fontSize: 32 }}>🎮</Text>
          <Text style={styles.tamagochiActionBtnText}>Jugar</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.tamagochiKillBtn}
        onPress={handleKill}
      >
        <Text style={styles.tamagochiKillBtnText}>💀 Matar Tamagochi</Text>
      </TouchableOpacity>
      
      <Text style={styles.infoCardText}>
        💡 Tu tamagochi crece automáticamente cada vez que abres la app y se alimenta solo.
        Si no lo visitas por varios días, su energía bajará.
      </Text>
    </ScrollView>
  );
}

// Unified Services Screen - Agrupa Marketplace, Taxi y Airbnb
function ServicesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'taxi' | 'accommodation'>('marketplace');
  
  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.servicesTabSelector}>
        <TouchableOpacity
          style={[styles.servicesTab, activeTab === 'marketplace' && styles.servicesTabActive]}
          onPress={() => setActiveTab('marketplace')}
        >
          <Text style={[styles.servicesTabText, activeTab === 'marketplace' && styles.servicesTabTextActive]}>
            🛒 Comprar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.servicesTab, activeTab === 'taxi' && styles.servicesTabActive]}
          onPress={() => setActiveTab('taxi')}
        >
          <Text style={[styles.servicesTabText, activeTab === 'taxi' && styles.servicesTabTextActive]}>
            🚕 Taxi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.servicesTab, activeTab === 'accommodation' && styles.servicesTabActive]}
          onPress={() => setActiveTab('accommodation')}
        >
          <Text style={[styles.servicesTabText, activeTab === 'accommodation' && styles.servicesTabTextActive]}>
            🏠 Alojamientos
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content based on active tab */}
      {activeTab === 'marketplace' && <MarketplaceScreen navigation={navigation} />}
      {activeTab === 'taxi' && <TaxiScreen navigation={navigation} />}
      {activeTab === 'accommodation' && <AirbnbScreen navigation={navigation} />}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1f7aec',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ 
          title: 'Muro', 
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>📰</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profiles"
        component={ProfilesGridScreen}
        options={{ 
          title: 'Personas', 
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>👥</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ 
          title: 'Servicios', 
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>🛍️</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{ 
          title: 'Mensajes', 
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>💬</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="MyProfile"
        component={ProfileScreen}
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ color, size }) => <Text style={{ fontSize: 24 }}>👤</Text>,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar contraseña' }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Nueva contraseña' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
        <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Verificación' }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Producto' }} />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Servicio' }} />
        <Stack.Screen name="CreateProduct" component={CreateProductScreen} options={{ title: 'Vender' }} />
        <Stack.Screen name="CreateService" component={CreateServiceScreen} options={{ title: 'Servicio' }} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Nueva publicación' }} />
        <Stack.Screen name="Chats" component={ChatsScreen} options={{ title: 'Mensajes' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
        <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ title: 'Video llamada', headerShown: false }} />
        <Stack.Screen name="UserOptions" component={UserOptionsScreen} options={{ title: 'Opciones' }} />
        <Stack.Screen name="Tamagochi" component={TamagochiScreen} options={{ title: 'Mi Tamagochi' }} />
        <Stack.Screen name="Wishes" component={WishesScreen} options={{ title: 'Deseos' }} />
        <Stack.Screen name="CreateWish" component={CreateWishScreen} options={{ title: 'Crear deseo' }} />
        <Stack.Screen name="WishDetail" component={WishDetailScreen} options={{ title: 'Deseo' }} />
        <Stack.Screen name="DriversMap" component={DriversMapScreen} options={{ title: 'Mapa de conductores' }} />
        <Stack.Screen name="RegisterDriver" component={RegisterDriverScreen} options={{ title: 'Registro de conductor' }} />
        <Stack.Screen name="RequestRide" component={RequestRideScreen} options={{ title: 'Pedir taxi' }} />
        <Stack.Screen name="RideQuotes" component={RideQuotesScreen} options={{ title: 'Cotizaciones' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  splashContainer: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  loaderContainer: { marginTop: 20, height: 4, position: 'relative' },
  loaderTrack: { width: '100%', height: 4, backgroundColor: '#e0e0e0', borderRadius: 2 },
  loaderBar: { height: 4, backgroundColor: '#1f7aec', borderRadius: 2 },
  // Login styles
  loginContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  loginContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1f7aec',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    maxWidth: '30%',
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: '#1f7aec',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 150,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Login styles
  loginContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  loginContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1f7aec',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  loginInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    maxWidth: '30%',
    width: '100%',
    alignSelf: 'center',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    backgroundColor: '#1f7aec',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 150,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 16 },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryBtn: { backgroundColor: '#1f7aec', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#eee', padding: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: '#333' },
  error: { color: '#c00', marginTop: 8 },
  warning: { backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 16 },
  infoCard: { padding: 16, borderRadius: 12, backgroundColor: '#f1f5f8', alignItems: 'center', marginVertical: 8 },
  infoCardText: { color: '#4a5568', textAlign: 'center' },
  errorCard: { padding: 14, borderRadius: 12, backgroundColor: '#ffe8e5', borderWidth: 1, borderColor: '#f8b4a3', marginBottom: 12 },
  errorCardText: { color: '#a7342d', textAlign: 'center' },
  
  // Grid styles (Grindr-style)
  gridContainer: { padding: 8 },
  gridRow: { justifyContent: 'space-between', marginBottom: 8 },
  gridItem: { width: '31%' },
  gridItemImage: { position: 'relative', width: '100%', aspectRatio: 1, marginBottom: 8 },
  gridItemImg: { width: '100%', height: '100%', borderRadius: 8 },
  gridItemName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  gridItemDistance: { fontSize: 12, color: '#666' },
  verifiedBadge: { 
    backgroundColor: '#1f7aec', 
    borderRadius: 10, 
    width: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 4,
  },
  verifiedBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  userNameContainer: { flexDirection: 'row', alignItems: 'center' },
  userNameText: { fontSize: 16, fontWeight: '600' },
  postAuthorNameContainer: { flexDirection: 'row', alignItems: 'center' },
  
  // Profile styles
  profileHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 16 },
  profilePhoto: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  profileName: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  profileBadges: { flexDirection: 'row', gap: 8 },
  verifiedBadgeLarge: { backgroundColor: '#1f7aec', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  verifiedBadgeLargeText: { color: 'white', fontWeight: '600' },
  profileSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  profileField: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  fieldLabel: { fontWeight: '600', width: 100 },
  fieldValue: { flex: 1 },
  
  // Product styles
  listContainer: { padding: 8 },
  productCard: { width: '48%', marginBottom: 16 },
  productCardSold: { opacity: 0.5 },
  productImagePlaceholder: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  productImage: { width: '100%', height: '100%', borderRadius: 8 },
  productImageText: { fontSize: 48 },
  soldBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#c00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  soldBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  productTitle: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '600', color: '#1f7aec' },
  
  // Service styles
  serviceCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 12 },
  serviceCardUnavailable: { opacity: 0.5 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceType: { fontSize: 12, fontWeight: '600', color: '#666' },
  availableBadge: { backgroundColor: '#28a745', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  availableBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  unavailableBadge: { backgroundColor: '#dc3545', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  unavailableBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  serviceTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  serviceDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  servicePrice: { fontSize: 16, fontWeight: '600', color: '#1f7aec' },
  
  // Header actions
  headerActions: { marginBottom: 16 },
  createBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: 'white', fontWeight: '600' },
  
  // Post styles
  postCard: { backgroundColor: '#fff', marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  postAuthor: { flexDirection: 'row', alignItems: 'center' },
  postAuthorAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  postAuthorName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  postTime: { fontSize: 12, color: '#666' },
  postLocation: { fontSize: 12, color: '#666', marginTop: 4 },
  postText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postImages: { marginBottom: 12 },
  postImageContainer: { position: 'relative', marginBottom: 8 },
  postImage: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  postVideo: { width: '100%', aspectRatio: 1, borderRadius: 8, marginBottom: 12 },
  stickerOverlay: { position: 'absolute', zIndex: 10 },
  stickerText: { fontSize: 24 },
  postActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  postActionIcon: { fontSize: 20, marginRight: 4 },
  postActionIconActive: { color: '#e91e63' },
  postActionCount: { fontSize: 14, color: '#666' },
  moreButton: { fontSize: 20, color: '#666', padding: 4 },
  
  // Report menu
  reportMenu: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  reportMenuItem: { padding: 12, fontSize: 14, color: '#333' },
  reportMenuItemCancel: { padding: 12, fontSize: 14, color: '#666', textAlign: 'center' },
  
  // Comments
  commentsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  commentItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  commentText: { fontSize: 14, marginTop: 4, color: '#333' },
  repliesContainer: { marginLeft: 20, marginTop: 8 },
  replyItem: { marginBottom: 8 },
  replyButton: { fontSize: 12, color: '#1f7aec', marginTop: 4 },
  addCommentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, padding: 8, paddingHorizontal: 12, marginRight: 8 },
  sendCommentButton: { color: '#1f7aec', fontWeight: '600' },
  
  // Create post media
  mediaPreviewContainer: { marginBottom: 16 },
  mediaPreview: { position: 'relative', marginBottom: 12 },
  mediaPreviewImg: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  mediaPreviewVideo: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  removeMediaBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  removeMediaBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  // Stickers
  stickersSection: { marginTop: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 },
  stickersTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  stickersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stickerBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  stickerEmoji: { fontSize: 24 },
  
  // Feed
  feedContainer: { padding: 16 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#666', textAlign: 'center' },
  
  // Ad Banner
  adBanner: {
    width: '100%',
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  adBannerImage: {
    width: '100%',
    height: '100%',
  },
  adBannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f7aec',
  },
  adBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  linkText: { color: '#1f7aec', marginTop: 12, textAlign: 'center' },
  errorText: { color: '#c00', marginBottom: 12, textAlign: 'center' },
  
  // Chat styles
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  chatItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1f7aec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatItemAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatItemTime: {
    fontSize: 12,
    color: '#666',
  },
  chatItemPreview: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#1f7aec',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  chatMessagesContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageBubbleSent: {
    backgroundColor: '#1f7aec',
    alignSelf: 'flex-end',
  },
  messageBubbleReceived: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageVideo: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  mediaButton: {
    padding: 8,
    marginRight: 8,
  },
  mediaButtonText: {
    fontSize: 24,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#1f7aec',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  createBtnText: { color: 'white', fontWeight: '600' },
  
  // Filter styles
  filterScroll: { marginBottom: 16 },
  filterContainer: { paddingHorizontal: 8, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#1f7aec' },
  filterChipText: { fontSize: 14, color: '#666' },
  filterChipTextActive: { color: 'white', fontWeight: '600' },
  
  // Room rental styles
  roomInfo: { fontSize: 14, color: '#666', marginBottom: 4 },
  roomAmenities: { fontSize: 12, color: '#888', marginBottom: 8 },
  professionalCategory: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  roomDetailsSection: { marginBottom: 24 },
  roomDetailImage: { width: 300, height: 200, borderRadius: 8, marginRight: 12 },
  roomImagePlaceholder: { width: '100%', height: 200, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  roomImagePlaceholderText: { fontSize: 64 },
  detailRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  detailLabel: { fontWeight: '600', width: 100, fontSize: 14 },
  detailValue: { flex: 1, fontSize: 14 },
  priceHighlight: { color: '#1f7aec', fontWeight: '600', fontSize: 18 },
  descriptionSection: { marginBottom: 24 },
  descriptionText: { fontSize: 14, lineHeight: 20, color: '#666' },
  locationSection: { marginBottom: 24 },
  locationText: { fontSize: 14, color: '#666' },
  amenitiesSection: { marginBottom: 16 },
  amenitiesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { backgroundColor: '#e8f4f8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  amenityText: { fontSize: 12, color: '#1f7aec' },
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#666' },
  
  // User options styles
  userHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 16 },
  userHeaderPhoto: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  userHeaderName: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  verifiedText: { color: '#1f7aec', fontWeight: '600' },
  actionButtons: { gap: 12 },
  actionButton: { backgroundColor: '#1f7aec', padding: 16, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  actionButtonSecondary: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, alignItems: 'center' },
  actionButtonSecondaryText: { color: '#333', fontSize: 16, fontWeight: '600' },
  actionButtonDanger: { backgroundColor: '#dc3545', padding: 16, borderRadius: 8, alignItems: 'center' },
  actionButtonDangerText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  // Modal styles
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 12, width: '90%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  modalButtonPrimary: { backgroundColor: '#dc3545' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  
  // Chat styles
  chatContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  chatMessages: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 8 },
  messageBubbleMe: { alignSelf: 'flex-end', backgroundColor: '#1f7aec' },
  messageBubbleOther: { alignSelf: 'flex-start', backgroundColor: '#e0e0e0' },
  messageTextMe: { color: 'white', fontSize: 14 },
  messageTextOther: { color: '#333', fontSize: 14 },
  messageImage: { width: 200, height: 200, borderRadius: 8 },
  chatInput: { flexDirection: 'row', padding: 12, backgroundColor: 'white', alignItems: 'center', gap: 8 },
  chatInputField: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 24 },
  chatButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1f7aec', justifyContent: 'center', alignItems: 'center' },
  chatButtonText: { fontSize: 20 },
  
  // Video call styles
  videoCallContainer: { flex: 1, backgroundColor: '#000' },
  videoCallRemote: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoCallLocal: { position: 'absolute', top: 20, right: 20, width: 120, height: 160, backgroundColor: '#333', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  videoCallText: { color: 'white', fontSize: 18, fontWeight: '600' },
  videoCallStatus: { color: '#ccc', fontSize: 14, marginTop: 8 },
  videoCallControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 24, gap: 24 },
  videoCallButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' },
  videoCallButtonActive: { backgroundColor: '#1f7aec' },
  videoCallButtonDanger: { backgroundColor: '#dc3545' },
  videoCallButtonText: { fontSize: 24 },
  chatButtonDisabled: { opacity: 0.5 },
  
  // Wish styles
  wishCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  wishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wishAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  wishTime: {
    fontSize: 12,
    color: '#666',
  },
  wishImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  wishVideo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  wishText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 8,
  },
  wishHelpers: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  wishHelpersText: {
    fontSize: 14,
    color: '#1f7aec',
    fontWeight: '500',
  },
  wishDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  wishDetailAuthor: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  wishDetailTime: {
    fontSize: 14,
    color: '#666',
  },
  wishDetailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  wishDetailVideo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  wishDetailText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 24,
  },
  helpersSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  helperItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  helperName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  helperMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  contactHelperBtn: {
    backgroundColor: '#1f7aec',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  contactHelperBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  helpSection: {
    marginBottom: 24,
  },
  fulfilledBadge: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  fulfilledBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  // Taxi/Driver styles
  taxiHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  taxiTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taxiSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  driverRegisterBtn: {
    backgroundColor: '#1f7aec',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  driverRegisterBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  driverDashboardBtn: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  driverDashboardBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  requestRideBtn: {
    backgroundColor: '#1f7aec',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  requestRideBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  viewMapBtn: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  viewMapBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  driversListSection: {
    marginTop: 20,
  },
  driverCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  driverDistance: {
    fontSize: 14,
    color: '#1f7aec',
    marginBottom: 4,
  },
  driverPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginTop: 4,
  },
  driverStatusSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: '#1f7aec',
    backgroundColor: '#e8f4f8',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#1f7aec',
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPlaceholderText: {
    fontSize: 64,
    marginBottom: 8,
  },
  mapPlaceholderLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  locationBtn: {
    width: 50,
    height: 50,
    backgroundColor: '#1f7aec',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBtnText: {
    fontSize: 24,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  mapPickerBtn: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  mapPickerBtnText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  quoteCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quoteDriverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quotePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f7aec',
  },
  quoteVehicle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quoteDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  quoteDetail: {
    fontSize: 14,
    color: '#666',
  },
  quoteTransparency: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quoteTransparencyText: {
    fontSize: 12,
    color: '#28a745',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1f7aec',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  
  // Profile Cover styles
  profileCoverContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileCover: {
    width: '100%',
    height: '100%',
  },
  profileCoverTamagochi: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCoverTamagochiEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  profileCoverTamagochiName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  profileCoverPlaceholder: {
    fontSize: 64,
    color: '#999',
  },
  editCoverBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCoverBtnText: {
    fontSize: 20,
    color: 'white',
  },
  gridItemTamagochiEmoji: {
    fontSize: 40,
  },
  gridItemCoverIcon: {
    fontSize: 32,
  },
  
  // Visit Tamagochi styles
  visitHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  visitTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  tamagochiDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  tamagochiEmojiLarge: {
    fontSize: 100,
    textAlign: 'center',
    marginBottom: 16,
  },
  tamagochiName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tamagochiStage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  tamagochiStats: {
    marginTop: 16,
    gap: 8,
  },
  tamagochiStat: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  visitForm: {
    marginTop: 24,
    marginBottom: 24,
  },
  visitTamagochiBtn: {
    backgroundColor: '#1f7aec',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  visitTamagochiBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  visitsSection: {
    marginTop: 24,
  },
  visitCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  visitVisitor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  visitMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  visitTime: {
    fontSize: 12,
    color: '#999',
  },
  coverPreview: {
    position: 'relative',
    marginBottom: 16,
  },
  coverPreviewImg: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  coverPreviewVideo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeCoverBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeCoverBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Services Screen styles
  servicesTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  servicesTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  servicesTabActive: {
    backgroundColor: '#1f7aec',
  },
  servicesTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  servicesTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Wishes FAB
  fabWishes: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f7aec',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabWishesText: {
    fontSize: 28,
  },
  wishesHeaderBtn: {
    marginRight: 16,
    padding: 8,
  },
  wishesHeaderBtnText: {
    fontSize: 24,
  },
});
