import { StatusBar } from 'expo-status-bar';
import { Button, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore, validateRut, UserProfile, Product, Service, Message } from './src/store';

type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Profile: undefined;
  Verification: undefined;
  ProductDetail: { product: Product };
  ServiceDetail: { service: Service };
  CreateProduct: undefined;
  CreateService: undefined;
  Chat: { userId: string; userName: string };
  VideoCall: { userId: string; userName: string };
  UserOptions: { user: UserProfile };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function LoginScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const login = useAuthStore((s) => s.login);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grip</Text>
      <TextInput
        placeholder="Tu nombre"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={() => name && login(name)}>
        <Text style={styles.primaryBtnText}>Entrar</Text>
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
  const [locationGranted, setLocationGranted] = useState<boolean>(false);
  const [others, setOthers] = useState<UserProfile[]>([]);

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

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setLocationGranted(true);
      const pos = await Location.getCurrentPositionAsync({});
      updateProfile({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      const mocks: UserProfile[] = Array.from({ length: 20 }).map((_, i) => ({
        id: `u${i + 1}`,
        name: `Usuario ${i + 1}`,
        isVerified: Math.random() > 0.5,
        lat: (pos.coords.latitude || 0) + (Math.random() - 0.5) * 0.02,
        lon: (pos.coords.longitude || 0) + (Math.random() - 0.5) * 0.02,
      }));
      setOthers(mocks);
    })();
  }, []);

  const sorted = useMemo(() => {
    if (!user?.lat || !user?.lon) return others;
    const d = (a: UserProfile) =>
      Math.hypot((a.lat ?? 0) - user.lat!, (a.lon ?? 0) - user.lon!);
    return [...others].sort((a, b) => d(a) - d(b));
  }, [others, user?.lat, user?.lon]);

  const renderGridItem = ({ item }: { item: UserProfile }) => {
    const distance = user?.lat && user?.lon && item.lat && item.lon
      ? Math.round(Math.hypot((item.lat - user.lat) * 111, (item.lon - user.lon) * 111) * 10) / 10
      : null;

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => navigation.navigate('UserOptions', { user: item })}
        onLongPress={() => navigation.navigate('UserOptions', { user: item })}
      >
        <View style={styles.gridItemImage}>
          {item.idPhotoUri ? (
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
          <Text>Concede permisos de ubicación para ver usuarios por distancia.</Text>
        </View>
      )}
      <FlatList
        data={sorted}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
}

function MarketplaceScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const mocks: Product[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `p${i + 1}`,
      sellerId: `u${i % 5}`,
      title: `Producto ${i + 1}`,
      description: `Descripción del producto ${i + 1}`,
      price: Math.floor(Math.random() * 50000) + 5000,
      currency: 'CLP',
      images: [],
      sold: Math.random() > 0.8,
      createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
    }));
    setProducts(mocks);
  }, []);

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
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateProduct')}
        >
          <Text style={styles.createBtnText}>+ Vender algo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products.filter(p => !p.sold)}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
}

function ServicesScreen({ navigation }: any) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    const mocks: Service[] = [
      // Taxis
      ...Array.from({ length: 3 }).map((_, i) => ({
        id: `taxi_${i + 1}`,
        providerId: `u${i % 2}`,
        type: 'taxi' as const,
        title: `Taxi ${i + 1}`,
        description: 'Transporte disponible 24/7',
        pricePerKm: 800,
        currency: 'CLP',
        available: true,
        createdAt: Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000,
      })),
      // Habitaciones (Airbnb style)
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `room_${i + 1}`,
        providerId: `u${i % 3}`,
        type: 'room_rental' as const,
        title: `Habitación ${i + 1}`,
        description: `Hermosa habitación en el centro, capacidad ${2 + i} personas`,
        pricePerNight: (15000 + i * 3000),
        currency: 'CLP',
        lat: -33.4489 + (Math.random() - 0.5) * 0.1,
        lon: -70.6693 + (Math.random() - 0.5) * 0.1,
        available: true,
        roomCapacity: 2 + i,
        roomImages: [],
        amenities: ['WiFi', 'TV', 'Baño privado', 'Cocina compartida'].slice(0, 2 + i % 3),
        createdAt: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      })),
      // Servicios profesionales
      ...Array.from({ length: 6 }).map((_, i) => {
        const categories = ['Abogado', 'Contador', 'Diseñador', 'Programador', 'Electricista', 'Plomero'];
        return {
          id: `prof_${i + 1}`,
          providerId: `u${i % 4}`,
          type: 'professional' as const,
          title: `${categories[i]} ${i + 1}`,
          description: `Servicios profesionales de ${categories[i].toLowerCase()}`,
          pricePerHour: (10000 + i * 2000),
          currency: 'CLP',
          available: true,
          professionalCategory: categories[i].toLowerCase(),
          createdAt: Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000,
        };
      }),
      // Delivery
      ...Array.from({ length: 2 }).map((_, i) => ({
        id: `delivery_${i + 1}`,
        providerId: `u${i}`,
        type: 'delivery' as const,
        title: `Delivery ${i + 1}`,
        description: 'Entrega rápida en tu zona',
        basePrice: 2000,
        currency: 'CLP',
        available: true,
        createdAt: Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000,
      })),
    ];
    setServices(mocks);
  }, []);

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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay servicios disponibles en esta categoría</Text>
          </View>
        }
      />
    </View>
  );
}

function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.currentUser)!;
  const logout = useAuthStore((s) => s.logout);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        {user.idPhotoUri ? (
          <Image source={{ uri: user.idPhotoUri }} style={styles.profilePhoto} />
        ) : (
          <View style={[styles.profilePhoto, { backgroundColor: '#ddd' }]} />
        )}
        <Text style={styles.profileName}>{user.name}</Text>
        <View style={styles.profileBadges}>
          {user.isVerified && (
            <View style={styles.verifiedBadgeLarge}>
              <Text style={styles.verifiedBadgeLargeText}>✓ Verificado</Text>
            </View>
          )}
        </View>
      </View>

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vender producto</Text>
      <Text>Formulario para crear producto (TODO: implementar)</Text>
      <Button title="Volver" onPress={() => navigation.goBack()} />
    </View>
  );
}

function CreateServiceScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ofrecer servicio</Text>
      <Text>Formulario para crear servicio (TODO: implementar)</Text>
      <Button title="Volver" onPress={() => navigation.goBack()} />
    </View>
  );
}

function ProductDetailScreen({ route }: any) {
  const { product } = route.params;
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.productPrice}>${product.price.toLocaleString()} {product.currency}</Text>
      <Text>{product.description}</Text>
      <Button title="Contactar vendedor" onPress={() => {}} />
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

function ChatScreen({ route, navigation }: any) {
  const { userId, userName } = route.params;
  const currentUser = useAuthStore((s) => s.currentUser);
  const { messages, sendMessage } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const chatId = `chat_${currentUser?.id}_${userId}`;
  const chatMessages = messages[chatId] || [];

  async function handleSendImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && currentUser) {
      sendMessage(chatId, userId, undefined, result.assets[0].uri);
    }
  }

  function handleSendText() {
    if (messageText.trim() && currentUser) {
      sendMessage(chatId, userId, messageText);
      setMessageText('');
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
        <TextInput
          style={styles.chatInputField}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Escribe un mensaje..."
          onSubmitEditing={handleSendText}
        />
        <TouchableOpacity style={styles.chatButton} onPress={handleSendText}>
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

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1f7aec',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Profiles"
        component={ProfilesGridScreen}
        options={{ title: 'Perfiles', tabBarIcon: () => <Text>👥</Text> }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ title: 'Comprar', tabBarIcon: () => <Text>🛒</Text> }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: 'Servicios', tabBarIcon: () => <Text>🚕</Text> }}
      />
      <Tab.Screen
        name="MyProfile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Verificación' }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Producto' }} />
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: 'Servicio' }} />
            <Stack.Screen name="CreateProduct" component={CreateProductScreen} options={{ title: 'Vender' }} />
            <Stack.Screen name="CreateService" component={CreateServiceScreen} options={{ title: 'Servicio' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ title: 'Video llamada', headerShown: false }} />
            <Stack.Screen name="UserOptions" component={UserOptionsScreen} options={{ title: 'Opciones' }} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
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
  
  // Grid styles (Grindr-style)
  gridContainer: { padding: 8 },
  gridRow: { justifyContent: 'space-between', marginBottom: 8 },
  gridItem: { width: '48%' },
  gridItemImage: { position: 'relative', width: '100%', aspectRatio: 1, marginBottom: 8 },
  gridItemImg: { width: '100%', height: '100%', borderRadius: 8 },
  gridItemName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  gridItemDistance: { fontSize: 12, color: '#666' },
  verifiedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#1f7aec', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  verifiedBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  
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
});
