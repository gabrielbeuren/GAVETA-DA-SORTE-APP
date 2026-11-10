
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

import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Participante {
  id: number;
  usuarioId: number;
  nome: string;
}

interface Grupo {
  id: number;
  nome: string;
  descricao: string;
  dataCriacao: string;
  administrador: {
    id: number;
    nome: string;
  };
  participantes: Participante[];
  totalDepositos: number;
}

interface Perfil {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  saldo: number;
  fotoPerfil: string | null;
}

export default function GrupoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [valorDeposito, setValorDeposito] = useState('');
  const [depositando, setDepositando] = useState(false);

  const [usuarioId, setUsuarioId] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  const [realizandoSorteio, setRealizandoSorteio] = useState(false);
  const [removendo, setRemovendo] = useState<number | null>(null);

  const ehAdministrador =
    grupo !== null &&
    perfil !== null &&
    grupo.administrador.id === perfil.id;

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
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

      setPerfil(dadosPerfil);

      await carregarGrupo();

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarGrupo = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const resposta = await fetch(
        `http://192.168.2.12:5280/api/AuthApi/detalhes-grupo/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'Não foi possível carregar o grupo.'
        );
        return;
      }

      setGrupo(dados);

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar o grupo.');
    }
  };

  const realizarDeposito = async () => {
    const valor = Number(valorDeposito.replace(',', '.'));

    if (!valorDeposito || isNaN(valor) || valor <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }

    try {
      setDepositando(true);

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const resposta = await fetch(
        'http://192.168.2.12:5280/api/AuthApi/depositar',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            grupoId: Number(id),
            valor: valor,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'Não foi possível realizar o depósito.'
        );
        return;
      }

      Alert.alert('Sucesso', dados.mensagem);

      setValorDeposito('');

      await carregarGrupo();

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setDepositando(false);
    }
  };

  const adicionarParticipante = async () => {
    const idUsuarioNovo = Number(usuarioId);

    if (
      !usuarioId ||
      !Number.isInteger(idUsuarioNovo) ||
      idUsuarioNovo <= 0
    ) {
      Alert.alert('Atenção', 'Informe um ID de usuário válido.');
      return;
    }

    try {
      setAdicionando(true);

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const resposta = await fetch(
        'http://192.168.2.12:5280/api/AuthApi/adicionar-participante',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            grupoId: Number(id),
            usuarioId: idUsuarioNovo,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'Não foi possível adicionar o participante.'
        );
        return;
      }

      Alert.alert('Sucesso', dados.mensagem);

      setUsuarioId('');

      await carregarGrupo();

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setAdicionando(false);
    }
  };

  const removerParticipante = (participante: Participante) => {
    Alert.alert(
      'Remover participante',
      `Deseja realmente remover ${participante.nome} do grupo? Os depósitos dele serão devolvidos ao saldo.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => confirmarRemocao(participante),
        },
      ]
    );
  };

  const confirmarRemocao = async (participante: Participante) => {
    try {
      setRemovendo(participante.id);

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const resposta = await fetch(
        `http://192.168.2.12:5280/api/AuthApi/remover-participante/${participante.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'Não foi possível remover o participante.'
        );
        return;
      }

      Alert.alert(
        'Sucesso',
        `${dados.mensagem}\nValor devolvido: ${Number(dados.valorDevolvido).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}`
      );

      await carregarGrupo();

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setRemovendo(null);
    }
  };

  const confirmarSorteio = () => {
    Alert.alert(
      'Realizar sorteio',
      'Deseja realmente realizar o sorteio? O prêmio será entregue ao participante sorteado e os depósitos serão zerados.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Realizar sorteio',
          onPress: executarSorteio,
        },
      ]
    );
  };

  const executarSorteio = async () => {
    try {
      setRealizandoSorteio(true);

      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const resposta = await fetch(
        `http://192.168.2.12:5280/api/AuthApi/realizar-sorteio/${id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Erro',
          dados.mensagem || 'Não foi possível realizar o sorteio.'
        );
        return;
      }

      Alert.alert(
        'SORTEIO REALIZADO!',
        `Vencedor: ${dados.vencedor}\n\nPrêmio: ${Number(dados.valorPremio).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}`
      );

      await carregarGrupo();

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível conectar com o servidor.');
    } finally {
      setRealizandoSorteio(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.back()}
        >
          <Text style={styles.textoVoltar}>‹ Voltar</Text>
        </TouchableOpacity>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#22d3ee"
            style={styles.carregando}
          />
        ) : grupo ? (
          <>
            <Text style={styles.logo}>GAVETA</Text>
            <Text style={styles.logoDestaque}>DA SORTE</Text>

            <Text style={styles.titulo}>{grupo.nome}</Text>

            <Text style={styles.descricao}>
              {grupo.descricao || 'Sem descrição'}
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>ADMINISTRADOR</Text>

              <Text style={styles.valor}>
                {grupo.administrador?.nome || 'Não informado'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>TOTAL DE DEPÓSITOS</Text>

              <Text style={styles.valorDestaque}>
                {grupo.totalDepositos.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>REALIZAR DEPÓSITO</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite o valor (ex: 50,00)"
                placeholderTextColor="#8293a8"
                keyboardType="decimal-pad"
                value={valorDeposito}
                onChangeText={setValorDeposito}
              />

              <TouchableOpacity
                style={styles.botao}
                onPress={realizarDeposito}
                disabled={depositando}
              >
                <Text style={styles.textoBotao}>
                  {depositando ? 'REALIZANDO...' : 'REALIZAR DEPÓSITO'}
                </Text>
              </TouchableOpacity>
            </View>

            {ehAdministrador && (
              <>
                <View style={styles.card}>
                  <Text style={styles.label}>ADICIONAR PARTICIPANTE</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Digite o ID do usuário"
                    placeholderTextColor="#8293a8"
                    keyboardType="numeric"
                    value={usuarioId}
                    onChangeText={setUsuarioId}
                  />

                  <TouchableOpacity
                    style={styles.botao}
                    onPress={adicionarParticipante}
                    disabled={adicionando}
                  >
                    <Text style={styles.textoBotao}>
                      {adicionando
                        ? 'ADICIONANDO...'
                        : 'ADICIONAR PARTICIPANTE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardSorteio}>
                  <Text style={styles.label}>SORTEIO DO GRUPO</Text>

                  <Text style={styles.textoSorteio}>
                    Realize o sorteio para escolher um participante e entregar o prêmio acumulado.
                  </Text>

                  <TouchableOpacity
                    style={styles.botaoSorteio}
                    onPress={confirmarSorteio}
                    disabled={realizandoSorteio}
                  >
                    <Text style={styles.textoBotaoSorteio}>
                      {realizandoSorteio
                        ? 'REALIZANDO SORTEIO...'
                        : 'REALIZAR SORTEIO'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.secao}>
              <Text style={styles.tituloSecao}>
                Participantes ({grupo.participantes.length})
              </Text>

              {grupo.participantes.map((participante) => (
                <View
                  key={participante.id}
                  style={styles.cardParticipante}
                >
                  <Text style={styles.nomeParticipante}>
                    {participante.nome}
                  </Text>

                  {ehAdministrador &&
                    participante.usuarioId !== grupo.administrador.id && (
                      <TouchableOpacity
                        style={styles.botaoRemover}
                        onPress={() => removerParticipante(participante)}
                        disabled={removendo === participante.id}
                      >
                        <Text style={styles.textoBotaoRemover}>
                          {removendo === participante.id
                            ? 'REMOVENDO...'
                            : 'REMOVER'}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              ))}
            </View>

            <Text style={styles.data}>
              Criado em:{' '}
              {new Date(grupo.dataCriacao).toLocaleDateString('pt-BR')}
            </Text>
          </>
        ) : null}

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

  botaoVoltar: {
    marginBottom: 25,
  },

  textoVoltar: {
    color: '#22d3ee',
    fontSize: 18,
    fontWeight: 'bold',
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

  descricao: {
    color: '#a8b8cc',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#102b4d',
    padding: 22,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#294968',
  },

  label: {
    color: '#a8b8cc',
    fontSize: 12,
    fontWeight: 'bold',
  },

  valor: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },

  valorDestaque: {
    color: '#22d3ee',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 10,
  },

  input: {
    backgroundColor: '#0a1f3d',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    fontSize: 16,
  },

  botao: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  textoBotao: {
    color: '#0a1f3d',
    fontSize: 14,
    fontWeight: 'bold',
  },

  cardSorteio: {
    backgroundColor: '#102b4d',
    padding: 22,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#22d3ee',
  },

  textoSorteio: {
    color: '#a8b8cc',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 21,
  },

  botaoSorteio: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },

  textoBotaoSorteio: {
    color: '#0a1f3d',
    fontSize: 14,
    fontWeight: 'bold',
  },

  secao: {
    marginTop: 25,
  },

  tituloSecao: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  cardParticipante: {
    backgroundColor: '#102b4d',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  nomeParticipante: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },

  botaoRemover: {
    backgroundColor: '#b83245',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
  },

  textoBotaoRemover: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  data: {
    color: '#8293a8',
    fontSize: 12,
    marginTop: 25,
    textAlign: 'center',
  },

  carregando: {
    marginTop: 80,
  },
});
