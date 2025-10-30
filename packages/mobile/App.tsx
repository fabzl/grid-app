import { StatusBar } from 'expo-status-bar';
import { Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore, validateRut, UserProfile } from './src/store';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Verification: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginScreen() {
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

function HomeScreen({ navigation }: any) {
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
      // Mock other users near you
      const mocks: UserProfile[] = Array.from({ length: 12 }).map((_, i) => ({
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

  return (
    <View style={styles.container}>
      {!locationGranted && <Text>Concede permisos de ubicación para ver usuarios por distancia.</Text>}
      {sorted.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.cardTitle}>{u.name}</Text>
          <Text style={styles.badge}>{u.isVerified ? 'Verificado' : 'No verificado'}</Text>
        </View>
      ))}
    </View>
  );
}

function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.currentUser)!;
  const logout = useAuthStore((s) => s.logout);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
      <Text>RUT: {user.rut ?? '—'}</Text>
      <Text>Estado: {user.isVerified ? 'Verificado' : 'No verificado'}</Text>
      <View style={{ height: 16 }} />
      <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Verification')}>
        <Text style={styles.primaryBtnText}>{user.isVerified ? 'Actualizar verificación' : 'Verificar cuenta'}</Text>
      </TouchableOpacity>
      <View style={{ height: 16 }} />
      <Button title="Salir" onPress={logout} />
    </View>
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

export default function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Cerca de ti' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
            <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Verificación' }} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
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
  card: { width: '100%', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '500', marginBottom: 4 },
  badge: { color: '#555' },
});
