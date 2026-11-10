import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await fetch(
        'http://192.168.2.12:5280/api/AuthApi/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            senha: senha,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'E-mail ou senha inválidos.'
        );
        return;
      }

      await SecureStore.setItemAsync('token', dados.token);
      router.replace('/home');

    

    } catch (erro) {
      Alert.alert(
        'Erro',
        'Não foi possível conectar com o servidor.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>GAVETA</Text>
          <Text style={styles.logoDestaque}>DA SORTE</Text>
          <Text style={styles.slogan}>
            Sua sorte começa aqui.
          </Text>
        </View>

        <View style={styles.formulario}>
          <Text style={styles.titulo}>Bem-vindo!</Text>

          <Text style={styles.subtitulo}>
            Entre na sua conta para continuar.
          </Text>

          <Text style={styles.label}>E-mail</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8293a8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#8293a8"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity
            style={styles.botao}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#0a1f3d" />
            ) : (
              <Text style={styles.textoBotao}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.rodape}>
            Gaveta da Sorte © 2026
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1f3d',
  },

  conteudo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },

  logo: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 5,
  },

  logoDestaque: {
    color: '#22d3ee',
    fontSize: 25,
    fontWeight: 'bold',
    letterSpacing: 4,
  },

  slogan: {
    color: '#a8b8cc',
    fontSize: 14,
    marginTop: 12,
  },

  formulario: {
    backgroundColor: '#102b4d',
    padding: 25,
    borderRadius: 18,
  },

  titulo: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: 'bold',
  },

  subtitulo: {
    color: '#a8b8cc',
    marginTop: 8,
    marginBottom: 28,
  },

  label: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#0a1f3d',
    borderWidth: 1,
    borderColor: '#294968',
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    marginBottom: 20,
  },

  botao: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  textoBotao: {
    color: '#0a1f3d',
    fontSize: 16,
    fontWeight: 'bold',
  },

  rodape: {
    color: '#8293a8',
    textAlign: 'center',
    marginTop: 25,
    fontSize: 12,
  },
});