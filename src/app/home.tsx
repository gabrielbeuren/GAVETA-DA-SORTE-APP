
import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Grupo {
  id: number;
  nome: string;
  descricao: string;
}

export default function HomeScreen() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [saldo, setSaldo] = useState(0);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricaoGrupo, setDescricaoGrupo] = useState('');
  const [criandoGrupo, setCriandoGrupo] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);

    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        Alert.alert('Erro', 'Você precisa fazer login novamente.');
        router.replace('/');
        return;
      }

      const respostaPerfil = await fetch(
        'http://192.168.2.12:5280/api/AuthApi/perfil',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dadosPerfil = await respostaPerfil.json();

      if (!respostaPerfil.ok) {
        Alert.alert('Erro', 'Não foi possível carregar seu perfil.');
        return;
      }

      setNome(dadosPerfil.nome);
      setSaldo(dadosPerfil.saldo);

      const respostaGrupos = await fetch(
        'http://192.168.2.12:5280/api/AuthApi/grupos',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dadosGrupos = await respostaGrupos.json();

      if (!respostaGrupos.ok) {
        Alert.alert('Erro', 'Não foi possível carregar seus grupos.');
        return;
      }

      setGrupos(dadosGrupos);

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const criarGrupo = async () => {
    if (!nomeGrupo.trim()) {
      Alert.alert('Atenção', 'Informe o nome do grupo.');
      return;
    }

    try {
      setCriandoGrupo(true);

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const resposta = await fetch(
        'http://192.168.2.12:5280/api/AuthApi/criar-grupo',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nomeGrupo.trim(),
            descricao: descricaoGrupo.trim(),
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'Não foi possível criar o grupo.'
        );
        return;
      }

      Alert.alert(
        'Sucesso',
        dados.mensagem || 'Grupo criado com sucesso!'
      );

      setNomeGrupo('');
      setDescricaoGrupo('');

      await carregarDados();

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setCriandoGrupo(false);
    }
  };

  const confirmarCriacao = () => {
    if (!nomeGrupo.trim()) {
      Alert.alert('Atenção', 'Informe o nome do grupo.');
      return;
    }

    Alert.alert(
      'Criar grupo',
      `Deseja criar o grupo "${nomeGrupo.trim()}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Criar',
          onPress: criarGrupo,
        },
      ]
    );
  };

  const sair = () => {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair do aplicativo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('token');
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>

        <Text style={styles.logo}>GAVETA</Text>
        <Text style={styles.logoDestaque}>DA SORTE</Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#22d3ee"
            style={styles.carregando}
          />
        ) : (
          <>
            <Text style={styles.titulo}>
              Olá, {nome}!
            </Text>

            <Text style={styles.subtitulo}>
              Que a sorte esteja ao seu lado!
            </Text>

            <View style={styles.cardSaldo}>
              <Text style={styles.labelSaldo}>
                SALDO DISPONÍVEL
              </Text>

              <Text style={styles.valorSaldo}>
                {saldo.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </Text>
            </View>

            <View style={styles.cardResumo}>
              <Text style={styles.numeroGrupos}>
                {grupos.length}
              </Text>

              <View>
                <Text style={styles.textoResumo}>
                  Grupos ativos
                </Text>

                <Text style={styles.descricaoResumo}>
                  Grupos dos quais você participa
                </Text>
              </View>
            </View>

            <View style={styles.cardCriarGrupo}>
              <Text style={styles.tituloCriarGrupo}>
                CRIAR NOVO GRUPO
              </Text>

              <Text style={styles.textoCriarGrupo}>
                Crie seu próprio grupo e seja o administrador.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nome do grupo"
                placeholderTextColor="#8293a8"
                value={nomeGrupo}
                onChangeText={setNomeGrupo}
                maxLength={100}
              />

              <TextInput
                style={[styles.input, styles.inputDescricao]}
                placeholder="Descrição do grupo (opcional)"
                placeholderTextColor="#8293a8"
                value={descricaoGrupo}
                onChangeText={setDescricaoGrupo}
                multiline
                maxLength={300}
              />

              <TouchableOpacity
                style={styles.botaoCriarGrupo}
                onPress={confirmarCriacao}
                disabled={criandoGrupo}
              >
                <Text style={styles.textoBotaoCriarGrupo}>
                  {criandoGrupo ? 'CRIANDO...' : 'CRIAR GRUPO'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.secaoGrupos}>
              <Text style={styles.tituloGrupos}>
                Meus grupos
              </Text>

              {grupos.length === 0 ? (
                <Text style={styles.semGrupos}>
                  Você ainda não participa de nenhum grupo.
                </Text>
              ) : (
                grupos.map((grupo) => (
                  <TouchableOpacity
                    key={grupo.id}
                    style={styles.cardGrupo}
                    onPress={() => router.push({
                      pathname: '/grupo',
                      params: { id: grupo.id.toString() },
                    })}
                  >
                    <Text style={styles.nomeGrupo}>
                      {grupo.nome}
                    </Text>

                    <Text style={styles.descricaoGrupo}>
                      {grupo.descricao || 'Sem descrição'}
                    </Text>

                    <Text style={styles.abrirGrupo}>
                      VER DETALHES →
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.botaoAtualizar}
              onPress={carregarDados}
            >
              <Text style={styles.textoBotaoAtualizar}>
                ATUALIZAR INFORMAÇÕES
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSair}
              onPress={sair}
            >
              <Text style={styles.textoBotaoSair}>
                SAIR DA CONTA
              </Text>
            </TouchableOpacity>

            <Text style={styles.rodape}>
              Gaveta da Sorte © 2026
            </Text>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1f3d',
  },

  conteudo: {
    padding: 25,
    paddingBottom: 40,
  },

  logo: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 5,
    textAlign: 'center',
  },

  logoDestaque: {
    color: '#22d3ee',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
  },

  titulo: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 40,
  },

  subtitulo: {
    color: '#a8b8cc',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 25,
  },

  cardSaldo: {
    backgroundColor: '#102b4d',
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#294968',
    marginBottom: 15,
  },

  labelSaldo: {
    color: '#a8b8cc',
    fontSize: 12,
    fontWeight: 'bold',
  },

  valorSaldo: {
    color: '#22d3ee',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
  },

  cardResumo: {
    backgroundColor: '#102b4d',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#294968',
  },

  numeroGrupos: {
    color: '#22d3ee',
    fontSize: 35,
    fontWeight: 'bold',
    marginRight: 20,
  },

  textoResumo: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  descricaoResumo: {
    color: '#a8b8cc',
    fontSize: 12,
    marginTop: 4,
  },

  cardCriarGrupo: {
    backgroundColor: '#102b4d',
    padding: 22,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#22d3ee',
    marginBottom: 30,
  },

  tituloCriarGrupo: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: 'bold',
  },

  textoCriarGrupo: {
    color: '#a8b8cc',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 5,
  },

  input: {
    backgroundColor: '#0a1f3d',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    fontSize: 15,
  },

  inputDescricao: {
    minHeight: 85,
    textAlignVertical: 'top',
  },

  botaoCriarGrupo: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },

  textoBotaoCriarGrupo: {
    color: '#0a1f3d',
    fontSize: 14,
    fontWeight: 'bold',
  },

  secaoGrupos: {
    marginBottom: 25,
  },

  tituloGrupos: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  cardGrupo: {
    backgroundColor: '#102b4d',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#294968',
  },

  nomeGrupo: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  descricaoGrupo: {
    color: '#a8b8cc',
    fontSize: 14,
    marginTop: 8,
  },

  abrirGrupo: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 15,
  },

  semGrupos: {
    color: '#a8b8cc',
    fontSize: 14,
  },

  botaoAtualizar: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },

  textoBotaoAtualizar: {
    color: '#0a1f3d',
    fontSize: 14,
    fontWeight: 'bold',
  },

  botaoSair: {
    backgroundColor: '#102b4d',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#294968',
  },

  textoBotaoSair: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
  },

  rodape: {
    color: '#8293a8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },

  carregando: {
    marginTop: 80,
  },
});
