// Livres Connect · Estudos para novo convertido
// Conteúdo das 10 lições, versão aprofundada (outubro de 2026), na linha
// renovada (neopentecostal) da Comunidade Cristã Livres em Cristo.
// Os versículos aparecem como referências para o aluno ler na própria Bíblia;
// os textos explicativos são próprios do sistema.
//
// Campos de cada estudo:
//   titulo, resumo, leitura          · cabeçalho
//   intro[]                          · introdução
//   pontos[[título, texto, refs]]    · o que a Bíblia ensina
//   aprofundar[]                     · "Para entender melhor"
//   duvidas[[pergunta, resposta]]    · dúvidas comuns
//   perguntas[]                      · para pensar e conversar
//   desafio, oracao, memorizar       · prática da semana
//   semana[7]                        · leitura bíblica de cada dia
// Para alterar um estudo, edite o texto abaixo e publique.

export const ESTUDOS = [
  /* ------------------------------------------------------------ 1 */
  {
    titulo: 'A certeza da salvação em Jesus Cristo',
    resumo: 'Quem crê em Jesus pode ter a certeza de que tem a vida eterna, não por merecimento, mas pela promessa de Deus.',
    leitura: '1 João 5:11-13 · Efésios 2:1-10',
    intro: [
      'Você tomou a decisão mais importante da sua vida: receber Jesus como Senhor e Salvador. Nos primeiros dias, é comum surgir uma pergunta no coração: "Será que estou mesmo salvo? E se eu errar de novo? E se amanhã eu não sentir nada?".',
      'Essas dúvidas não são sinal de que a sua fé é falsa. Elas aparecem porque estamos acostumados a viver num mundo onde tudo precisa ser conquistado e merecido. A salvação funciona de outro jeito: ela é um presente que Deus oferece e que nós recebemos pela fé.',
      'O apóstolo João escreveu uma carta inteira para que os cristãos tivessem segurança. Ele diz que escreveu "para que vocês saibam que têm a vida eterna". Deus não quer que você viva inseguro, mas firme na promessa dele. Neste estudo vamos ver por que essa certeza é possível e como ela muda o seu dia a dia.'
    ],
    pontos: [
      ['A salvação é um presente de Deus', 'Ninguém compra nem merece a salvação. Paulo explica que fomos salvos pela graça, por meio da fé, e que isso não vem de nós: é dom de Deus. Se dependesse das nossas obras, ninguém conseguiria, porque todos pecaram. As boas obras continuam importantes, mas são o fruto da salvação, não o preço dela. Primeiro Deus nos salva; depois, agradecidos, passamos a viver para ele.', 'Efésios 2:8-10 · Romanos 3:23-24 · Romanos 6:23'],
      ['Jesus pagou o preço completo', 'Na cruz, Jesus levou sobre si o castigo que era nosso. Quando ele disse "Está consumado", estava declarando que a dívida foi paga por inteiro. Não falta nada a ser acrescentado. Por isso, quem está em Cristo não vive mais debaixo de condenação. Quando a culpa voltar a acusar você, lembre-se: o que Jesus fez é maior do que o que você fez.', 'João 19:30 · Romanos 5:8 · Romanos 8:1 · 1 Pedro 2:24'],
      ['A promessa é para todo aquele que crê', 'Deus promete vida eterna a todo aquele que crê no Filho. Crer não é só concordar que Jesus existiu; é confiar nele, entregar a vida a ele e confessá-lo como Senhor. A certeza não está na força da nossa fé, mas na fidelidade de quem prometeu. Uma fé pequena num Deus fiel salva; uma fé grande em qualquer outra coisa não salva.', 'João 3:16-18 · João 5:24 · Romanos 10:9-13'],
      ['Ninguém arranca você das mãos de Jesus', 'Jesus se apresenta como o Bom Pastor. Ele conhece cada ovelha pelo nome, dá a ela a vida eterna e a segura nas mãos. Ele também diz que o Pai é maior do que todos e que ninguém pode arrancar as ovelhas da mão do Pai. A sua segurança não depende de você segurar Deus com força, mas de Deus segurar você.', 'João 10:27-30 · Filipenses 1:6 · Judas 24'],
      ['O Espírito Santo confirma e a vida nova aparece', 'Deus não deixa o novo convertido sozinho. O Espírito Santo passa a morar em quem crê e testemunha no coração que somos filhos de Deus. Com o tempo, essa vida nova começa a aparecer: amor pelos irmãos, vontade de obedecer, sensibilidade ao pecado e alegria em estar perto de Deus. Essas mudanças não salvam, mas mostram que a salvação é real.', 'Romanos 8:15-16 · 2 Coríntios 5:17 · 1 João 3:14 · Efésios 1:13-14']
    ],
    aprofundar: [
      'Existe uma diferença importante entre a nossa posição e a nossa experiência. Quando cremos em Jesus, a nossa posição muda para sempre: somos declarados justos, perdoados e adotados como filhos. A nossa experiência, porém, ainda tem altos e baixos: há dias de muita alegria e dias de luta. Os sentimentos mudam; a posição não muda.',
      'Por isso a Bíblia compara a nova vida a um nascimento. Um bebê que acabou de nascer é tão filho quanto um adulto, embora ainda precise crescer. Você já é filho de Deus por inteiro, e agora vai crescer em maturidade. Errar faz parte do crescimento, e o caminho quando erramos é voltar para o Pai, confessar e seguir em frente.',
      'Ter certeza da salvação não deixa ninguém acomodado. Pelo contrário: quem sabe que foi amado e perdoado de graça passa a amar mais, servir mais e querer agradar a Deus. A gratidão é o motor da vida cristã.'
    ],
    duvidas: [
      ['E se eu pecar de novo, perco a salvação?', 'O cristão ainda pode errar, mas não vive mais acomodado no pecado. Quando cair, confesse a Deus com sinceridade: ele é fiel e justo para perdoar. O pecado atrapalha a nossa comunhão com Deus, mas não desfaz a obra de Jesus para quem verdadeiramente creu. Busque ajuda do seu discipulador para vencer as áreas em que você mais tropeça (1 João 1:9; 2:1-2).'],
      ['Não senti nada especial quando aceitei Jesus. Fui salvo mesmo assim?', 'Sim. Algumas pessoas choram, outras sentem paz, outras não sentem nada diferente na hora. A salvação não depende de uma emoção, mas de crer e receber Jesus. As mudanças vão aparecendo com o tempo.'],
      ['Preciso ser batizado para ser salvo?', 'O batismo é uma ordem de Jesus e um passo muito importante, que vamos estudar no estudo 3. Mas ele é a declaração pública de quem já foi salvo pela fé, e não a causa da salvação. O ladrão na cruz creu e foi salvo sem ser batizado (Lucas 23:42-43).']
    ],
    perguntas: [
      'Com as suas palavras, o que significa dizer que a salvação é um presente?',
      'Por que a certeza da salvação não pode depender dos nossos sentimentos?',
      'Qual destes versículos mais falou com você hoje? Por quê?',
      'Que mudanças você já percebeu na sua vida desde que aceitou Jesus?',
      'Quem é uma pessoa da sua família ou do seu trabalho que precisa ouvir sobre esse presente?'
    ],
    desafio: 'Escreva num papel a data em que você aceitou Jesus, o que estava acontecendo na sua vida e uma oração de gratidão. Guarde dentro da sua Bíblia. Nesta semana, conte para uma pessoa de confiança a decisão que você tomou.',
    oracao: 'Senhor Jesus, obrigado porque morreste por mim e pagaste tudo o que eu devia. Eu creio em ti e te recebo como meu Senhor e Salvador. Tira do meu coração o medo e a dúvida, e me dá a certeza de que sou teu filho. Ensina-me a viver agradecido todos os dias. Amém.',
    memorizar: '1 João 5:13',
    semana: ['João 3:1-21', 'João 10:1-30', 'Romanos 5:1-11', 'Romanos 8:1-17', 'Efésios 2:1-10', '1 João 1:1-10', '1 João 5:1-13']
  },
  /* ------------------------------------------------------------ 2 */
  {
    titulo: 'Arrependimento e nova vida em Cristo',
    resumo: 'Arrepender-se é mudar de direção: deixar o pecado e seguir Jesus, com a ajuda do Espírito Santo.',
    leitura: 'Lucas 15:11-32 · Efésios 4:17-32',
    intro: [
      'Jesus contou a história de um jovem que pediu a herança ao pai, saiu de casa e gastou tudo vivendo de forma irresponsável. Quando o dinheiro acabou, ele foi cuidar de porcos e passou fome. Então "caiu em si", reconheceu o erro e decidiu voltar. Antes que ele terminasse de pedir perdão, o pai correu, abraçou o filho e fez uma festa.',
      'Essa parábola mostra o coração de Deus e também o que é o arrependimento: reconhecer que estamos longe, tomar a decisão de voltar e ser recebidos com amor. Arrependimento não é castigo, é o caminho de volta para casa.',
      'Neste estudo você vai entender que a vida cristã começa com arrependimento e continua com transformação. Deus não apenas apaga o passado; ele nos dá um coração novo e o seu Espírito para vivermos de um jeito novo.'
    ],
    pontos: [
      ['Arrependimento é mudar de mente e de direção', 'A palavra usada no Novo Testamento para arrependimento significa mudar a forma de pensar. Quem se arrepende passa a enxergar o pecado como Deus enxerga e, por isso, muda de rumo. Não é apenas parar de fazer coisas erradas, mas voltar-se para Deus e caminhar com ele.', 'Atos 3:19 · Atos 26:20 · Isaías 55:6-7'],
      ['Remorso não é o mesmo que arrependimento', 'Remorso é a tristeza por ter errado ou por ter sido descoberto. Judas sentiu remorso e se afundou no desespero; Pedro se arrependeu e foi restaurado. Paulo explica que a tristeza segundo Deus produz arrependimento que leva à salvação, enquanto a tristeza do mundo produz morte. O arrependimento verdadeiro sempre nos aproxima de Deus.', '2 Coríntios 7:9-11 · Mateus 27:3-5 · João 21:15-19'],
      ['Deus perdoa e purifica quem confessa', 'Confessar é concordar com Deus sobre o pecado, sem desculpas e sem esconder. A promessa é clara: se confessarmos, ele é fiel e justo para perdoar e nos purificar de toda injustiça. Davi, depois de um pecado grave, viveu angustiado enquanto escondia o erro; quando confessou, encontrou perdão e alegria.', '1 João 1:8-9 · Salmos 32:1-5 · Salmos 51:1-12'],
      ['Em Cristo somos nova criação', 'Deus não faz apenas uma reforma no que éramos: ele faz algo novo. A Bíblia diz que as coisas antigas já passaram e que tudo se fez novo. Isso significa que o seu passado não define mais a sua identidade. Você não é mais o que fez; você é o que Deus diz que você é: filho, perdoado e amado.', '2 Coríntios 5:17 · João 1:12 · Ezequiel 36:26-27'],
      ['Tirar a roupa velha e vestir a nova', 'Paulo compara a vida cristã a trocar de roupa. Tiramos atitudes antigas, como mentira, raiva descontrolada, roubo, palavras sujas e amargura, e vestimos atitudes novas, como verdade, trabalho honesto, palavras que edificam, bondade e perdão. É um processo diário, feito com a força do Espírito Santo, não apenas com força de vontade.', 'Efésios 4:22-32 · Colossenses 3:5-14 · Gálatas 5:16']
    ],
    aprofundar: [
      'Muitos novos convertidos ficam assustados quando percebem que algumas lutas antigas continuam. Isso é normal. Na conversão, o pecado perde o direito de governar a nossa vida, mas ainda precisamos aprender a viver em liberdade. É como alguém que sai da prisão: está livre, mas precisa aprender a viver como pessoa livre.',
      'Algumas áreas mudam de uma vez; outras exigem tempo, disciplina e ajuda. Vícios, por exemplo, muitas vezes precisam de acompanhamento pastoral, de amigos que orem junto e, em alguns casos, de ajuda profissional. Buscar ajuda não é falta de fé; é sabedoria.',
      'O arrependimento também pode envolver reparar danos: devolver o que foi tirado, pedir perdão a quem foi ferido, acertar uma situação injusta. Zaqueu, quando encontrou Jesus, decidiu devolver o que tinha tirado dos outros. A fé verdadeira aparece nas atitudes.'
    ],
    duvidas: [
      ['Já pedi perdão por um pecado, mas ainda me sinto culpado. O que faço?', 'Se você confessou com sinceridade, Deus perdoou. A culpa que continua pode ser uma acusação do inimigo ou uma ferida que precisa de cura. Leia Romanos 8:1 em voz alta, agradeça a Deus pelo perdão e, se a culpa persistir, converse com seu discipulador ou com o pastor.'],
      ['Preciso confessar meus pecados para uma pessoa?', 'O perdão vem de Deus. Mas a Bíblia também nos incentiva a confessar nossas faltas uns aos outros e orar uns pelos outros (Tiago 5:16). Abrir o coração com alguém de confiança e maduro na fé traz cura e ajuda a vencer.'],
      ['E se a pessoa que eu feri não quiser me perdoar?', 'Faça a sua parte com humildade: peça perdão e, se for o caso, repare o dano. A resposta do outro não está nas suas mãos. Continue orando por ela e deixe o restante com Deus (Romanos 12:18).']
    ],
    perguntas: [
      'Qual a diferença entre remorso e arrependimento? Dê um exemplo.',
      'O que mais chama a sua atenção na reação do pai na história do filho pródigo?',
      'Que "roupa velha" Deus está pedindo que você tire nesta fase da sua vida?',
      'Que "roupa nova" você quer vestir? Que atitude prática mostra isso?',
      'Há alguém que você precisa perdoar ou a quem precisa pedir perdão?'
    ],
    desafio: 'Separe um momento a sós com Deus, leia o Salmo 51 e entregue a ele, por escrito ou em voz alta, uma área específica da sua vida. Se houver algo a reparar ou alguém a quem pedir perdão, dê esse passo nesta semana, de preferência conversando antes com seu discipulador.',
    oracao: 'Pai, eu reconheço que pequei e que muitas vezes andei longe de ti. Obrigado porque me recebes de braços abertos. Perdoa os meus pecados e me purifica. Tira de mim tudo o que é velho e me dá um coração novo. Espírito Santo, me ajuda a viver de um jeito que agrade ao Senhor. Amém.',
    memorizar: '2 Coríntios 5:17',
    semana: ['Lucas 15:1-32', 'Salmos 32', 'Salmos 51', 'Lucas 19:1-10', 'Efésios 4:17-32', 'Colossenses 3:1-17', 'Romanos 6:1-14']
  },
  /* ------------------------------------------------------------ 3 */
  {
    titulo: 'Batismo nas águas',
    resumo: 'O batismo é a declaração pública de que você morreu para a vida velha e ressuscitou com Cristo para uma vida nova.',
    leitura: 'Mateus 28:18-20 · Romanos 6:1-11 · Atos 8:26-39',
    intro: [
      'Antes de voltar para o céu, Jesus deu uma ordem aos discípulos: fazer discípulos de todas as nações e batizá-los em nome do Pai, do Filho e do Espírito Santo. Desde o começo da igreja, quem cria em Jesus era batizado nas águas, muitas vezes no mesmo dia.',
      'O batismo não é um ritual vazio nem uma tradição da igreja. É um ato de obediência ao Senhor e um testemunho público. Quando você desce às águas, está dizendo diante de Deus, da igreja e de todos: "Eu pertenço a Jesus".',
      'Neste estudo você vai entender o significado do batismo, quem deve ser batizado e como se preparar para esse dia tão especial.'
    ],
    pontos: [
      ['É uma ordem de Jesus', 'O batismo não foi ideia de um pastor ou de uma denominação. O próprio Jesus mandou batizar os que creem. Ele mesmo foi batizado por João no rio Jordão para nos dar o exemplo, e o Pai se agradou disso. Ser batizado é obedecer ao Senhor que nos salvou.', 'Mateus 28:19-20 · Mateus 3:13-17 · Marcos 16:15-16'],
      ['É para quem já creu', 'Em todos os batismos do livro de Atos, as pessoas primeiro ouviram a mensagem, creram e se arrependeram, e só depois foram batizadas. Por isso batizamos quem já tem idade e consciência para entender e decidir seguir Jesus. Crianças pequenas são apresentadas ao Senhor, como Jesus abençoou as crianças, e são batizadas quando puderem crer por si mesmas.', 'Atos 2:38-41 · Atos 8:12 · Atos 8:36-38 · Marcos 10:13-16'],
      ['Mostra que morremos e ressuscitamos com Cristo', 'Paulo explica que, no batismo, somos sepultados com Cristo e ressuscitamos com ele para andar em novidade de vida. Ao descer às águas, declaramos que a vida velha morreu; ao subir, que nascemos para uma vida nova. Por isso praticamos o batismo por imersão: a pessoa é mergulhada inteira, como num sepultamento.', 'Romanos 6:3-5 · Colossenses 2:12'],
      ['É um testemunho público', 'A fé é pessoal, mas não é escondida. O eunuco etíope, assim que entendeu o evangelho, pediu para ser batizado e seguiu viagem cheio de alegria. O batismo é a sua "cerimônia de casamento" com Jesus diante de testemunhas: a igreja celebra com você e passa a caminhar ao seu lado.', 'Atos 8:35-39 · Mateus 10:32 · Gálatas 3:26-27'],
      ['Abre a porta para a vida de membro', 'Depois do batismo, a pessoa passa a fazer parte da igreja local como membro: participa da Ceia do Senhor, é integrada a um ministério e cresce em comunhão com os irmãos. Na Jornada da Alma, o batismo é a etapa que leva você a ser membro da família.', 'Atos 2:41-42 · 1 Coríntios 12:13']
    ],
    aprofundar: [
      'O batismo não lava pecados por causa da água. O que nos purifica é o sangue de Jesus, recebido pela fé. A água é um sinal visível de uma realidade espiritual: a pessoa já foi lavada por dentro e agora mostra isso por fora. Pedro diz que o batismo é o compromisso de uma boa consciência para com Deus.',
      'Também é importante distinguir o batismo nas águas do batismo no Espírito Santo, que estudaremos no estudo 9. O batismo nas águas é um ato de obediência feito pela igreja; o batismo no Espírito Santo é uma experiência em que o próprio Jesus nos enche de poder. Os dois são promessas para todo cristão.',
      'Antes do batismo, a igreja oferece uma classe de preparação e uma conversa pastoral. Não é uma prova para ver se você é bom o suficiente, mas um cuidado para que você entenda o passo que está dando e para acertar o que for necessário, como situações de vida que precisam ser regularizadas.'
    ],
    duvidas: [
      ['Fui batizado quando bebê. Preciso ser batizado de novo?', 'O batismo bíblico acontece depois que a pessoa crê. Quem foi batizado ainda bebê não tomou essa decisão. Por isso orientamos o batismo por imersão agora, como declaração pessoal de fé. Converse com o pastor sobre isso com tranquilidade: não é desprezo pela sua história, mas obediência ao modelo das Escrituras.'],
      ['Preciso estar "perfeito" para ser batizado?', 'Não. O batismo é para pecadores salvos pela graça que decidiram seguir Jesus. O que se espera é arrependimento sincero e disposição de obedecer. Ninguém é batizado porque já chegou lá, mas porque começou a caminhada.'],
      ['E se eu tiver medo da água ou alguma limitação de saúde?', 'Converse com a liderança. A equipe ajuda você com calma e segurança, e situações especiais são tratadas com cuidado e respeito.']
    ],
    perguntas: [
      'Por que o batismo não é o que nos salva, mas mesmo assim é tão importante?',
      'O que significa ser "sepultado e ressuscitado" com Cristo?',
      'O que o exemplo do eunuco etíope ensina sobre a pressa em obedecer?',
      'Quem você gostaria de convidar para assistir ao seu batismo?',
      'O que ainda impede você de dar esse passo?'
    ],
    desafio: 'Converse com seu discipulador ou com o pastor sobre o seu batismo e peça para participar da próxima classe de batismo. Escreva um pequeno testemunho (como era sua vida, como conheceu Jesus e o que mudou) para compartilhar no dia.',
    oracao: 'Senhor, eu quero te obedecer em tudo. Prepara o meu coração para o batismo. Que a minha vida velha fique para trás e que eu ande em novidade de vida. Dá-me coragem para testemunhar diante de todos que eu pertenço a ti. Amém.',
    memorizar: 'Romanos 6:4',
    semana: ['Mateus 3:1-17', 'Mateus 28:16-20', 'Atos 2:36-47', 'Atos 8:26-40', 'Atos 16:25-34', 'Romanos 6:1-14', 'Colossenses 2:6-15']
  },
  /* ------------------------------------------------------------ 4 */
  {
    titulo: 'Oração: conversando com o Pai',
    resumo: 'Orar é conversar com Deus como filho. Jesus nos ensinou como fazer isso todos os dias.',
    leitura: 'Mateus 6:5-15 · Filipenses 4:6-7 · Lucas 11:1-13',
    intro: [
      'Os discípulos viam Jesus orar com frequência: de madrugada, antes de decisões importantes, no meio do cansaço e na hora da dor. Um dia, eles pediram: "Senhor, ensina-nos a orar". Não pediram para aprender a fazer milagres ou a pregar, mas a orar.',
      'Orar não é repetir palavras difíceis nem fazer um discurso bonito. É conversar com Deus como um filho conversa com o pai: com sinceridade, gratidão, pedidos e também escutando.',
      'Neste estudo você vai conhecer o modelo de oração que Jesus ensinou, aprender a orar em nome de Jesus e começar um hábito diário de oração.'
    ],
    pontos: [
      ['Deus é Pai e quer ouvir você', 'Jesus nos ensina a começar a oração dizendo "Pai nosso". Por causa de Jesus, temos acesso direto a Deus, sem intermediários humanos. Ele não é um juiz distante, mas um Pai que conhece as nossas necessidades e tem prazer em nos ouvir. Você pode chegar a ele com confiança, a qualquer hora.', 'Mateus 6:9 · Hebreus 4:14-16 · Romanos 8:15'],
      ['O modelo que Jesus ensinou', 'O Pai Nosso é um roteiro: começa adorando e honrando o nome de Deus; pede que o Reino e a vontade dele aconteçam na terra; apresenta as necessidades do dia; pede perdão e se compromete a perdoar; pede proteção contra o mal. Você pode usar cada frase como um tópico e orar com as suas palavras.', 'Mateus 6:9-13 · Lucas 11:2-4'],
      ['Orar em nome de Jesus e com fé', 'Jesus disse que tudo o que pedirmos em seu nome, conforme a vontade de Deus, ele fará. Orar em nome de Jesus é orar com base no que ele conquistou e de acordo com o caráter dele. A fé não é forçar Deus a fazer o que queremos, mas confiar que ele ouve e responde, do jeito e no tempo dele.', 'João 14:13-14 · João 16:23-24 · Marcos 11:22-24 · 1 João 5:14-15'],
      ['Perseverar e não desanimar', 'Jesus contou a parábola de uma viúva que insistiu com um juiz até ser atendida, para ensinar que devemos orar sempre e nunca desanimar. Algumas respostas chegam rápido; outras levam tempo. Deus pode responder "sim", "espere" ou "tenho algo melhor". Em todos os casos, a oração muda a situação e muda também a nós.', 'Lucas 18:1-8 · Lucas 11:5-13 · 1 Tessalonicenses 5:17'],
      ['A oração traz paz e poder', 'Em vez de viver ansioso, Paulo ensina a apresentar tudo a Deus em oração, com ação de graças. A promessa é a paz de Deus guardando o coração e a mente. A igreja primitiva orava junta e o lugar tremia, as portas da prisão se abriam e enfermos eram curados. A oração é onde a nossa fraqueza encontra o poder de Deus.', 'Filipenses 4:6-7 · Atos 4:23-31 · Atos 12:5-17 · Tiago 5:13-16']
    ],
    aprofundar: [
      'Existem vários tipos de oração. Adoração é exaltar quem Deus é. Gratidão é agradecer pelo que ele fez. Confissão é reconhecer pecados. Súplica é pedir pelas nossas necessidades. Intercessão é orar pelos outros. Uma vida de oração saudável tem um pouco de tudo isso.',
      'Na nossa caminhada, também valorizamos a oração no Espírito, que inclui orar com o entendimento e, para quem recebeu esse dom, orar em línguas. A oração no Espírito edifica o crente e nos ajuda a orar quando não sabemos o que dizer. Estudaremos isso com mais calma no estudo 9.',
      'Uma dica prática: tenha um lugar e um horário. Jesus falou de entrar no quarto e fechar a porta. Pode ser cedo, antes de todos acordarem, ou à noite. Comece com dez minutos e vá aumentando. Use uma caderneta para anotar pedidos e respostas; com o tempo, você verá a fidelidade de Deus registrada.'
    ],
    duvidas: [
      ['Não sei orar bonito. Deus me ouve mesmo assim?', 'Sim. Deus olha o coração, não as palavras. Jesus criticou quem orava para ser visto e com muitas palavras. Fale com ele como você fala com alguém que ama você.'],
      ['Orei e Deus não respondeu. O que aconteceu?', 'Às vezes a resposta é "espere"; às vezes é "não", porque Deus vê o que nós não vemos. Continue orando, examine se há algo a acertar e confie no caráter dele. Converse com seu discipulador e peça para orarem juntos.'],
      ['Posso orar em qualquer lugar?', 'Pode e deve. Além do momento separado, você pode orar no ônibus, no trabalho, cozinhando. A oração pode se tornar uma conversa contínua com Deus ao longo do dia.']
    ],
    perguntas: [
      'O que muda na sua oração quando você entende que Deus é seu Pai?',
      'Qual parte do Pai Nosso você mais precisa praticar hoje?',
      'Você já viu uma resposta de oração na sua vida? Conte como foi.',
      'Qual é o melhor horário e lugar para você orar todos os dias?',
      'Por quem você vai interceder nesta semana?'
    ],
    desafio: 'Durante sete dias, separe pelo menos dez minutos para orar seguindo o modelo do Pai Nosso. Use uma caderneta para anotar três motivos de gratidão por dia e uma lista de pessoas e pedidos. No fim da semana, compartilhe com seu discipulador o que aprendeu.',
    oracao: 'Pai, obrigado porque posso falar contigo a qualquer hora. Ensina-me a orar. Quero estar na tua presença todos os dias. Que o teu Reino venha e a tua vontade seja feita na minha vida, na minha casa e na minha cidade. Em nome de Jesus. Amém.',
    memorizar: 'Filipenses 4:6-7',
    semana: ['Mateus 6:5-15', 'Lucas 11:1-13', 'Lucas 18:1-14', 'João 17', 'Atos 4:23-31', 'Atos 12:1-17', 'Tiago 5:13-18']
  },
  /* ------------------------------------------------------------ 5 */
  {
    titulo: 'A Bíblia, alimento para a alma',
    resumo: 'A Bíblia é a Palavra de Deus. Ler, entender e praticar a Palavra faz a fé crescer forte.',
    leitura: '2 Timóteo 3:14-17 · Salmos 119:9-16, 105 · Tiago 1:22-25',
    intro: [
      'Um recém-nascido precisa de leite todos os dias para crescer. O apóstolo Pedro usa essa imagem para falar dos novos convertidos: "desejem o puro leite da Palavra, para que por ele cresçam". Assim como o corpo precisa de alimento, a alma precisa da Palavra de Deus.',
      'A Bíblia não é um livro comum. Ela foi escrita por cerca de quarenta pessoas ao longo de mais de mil e quinhentos anos, mas tem uma mensagem só: o plano de Deus para salvar a humanidade por meio de Jesus.',
      'Neste estudo você vai entender por que a Bíblia é confiável, como ela está organizada e como começar a ler de um jeito simples e proveitoso.'
    ],
    pontos: [
      ['A Bíblia é inspirada por Deus', 'Paulo escreveu que toda a Escritura é inspirada por Deus, ou seja, "soprada" por ele. Deus usou pessoas, com seus estilos e histórias, mas guiou o que escreveram pelo Espírito Santo. Por isso a Bíblia é a nossa regra de fé e de vida: quando uma ideia, um sonho ou uma profecia contradiz a Palavra, ficamos com a Palavra.', '2 Timóteo 3:16 · 2 Pedro 1:20-21 · Isaías 40:8'],
      ['Ela nos ensina, corrige e prepara', 'A Bíblia serve para ensinar a verdade, mostrar onde erramos, corrigir o caminho e nos treinar para uma vida justa. Ela nos equipa para toda boa obra. É como um manual de vida escrito por quem nos criou.', '2 Timóteo 3:16-17 · Salmos 19:7-11'],
      ['Ela é alimento e é luz', 'Jesus venceu a tentação no deserto respondendo com a Palavra: "Nem só de pão viverá o homem, mas de toda palavra que sai da boca de Deus". O salmista diz que a Palavra é lâmpada para os pés e luz para o caminho. Quem se alimenta da Palavra fica forte para enfrentar as tentações e enxerga melhor as decisões.', 'Mateus 4:1-11 · Salmos 119:105 · 1 Pedro 2:2'],
      ['Ela é viva e transforma', 'A Palavra de Deus é viva e eficaz, mais cortante que uma espada. Ela entra no coração, revela intenções e produz mudança. Muitas vezes, ao ler a Bíblia, o Espírito Santo destaca um versículo e fala diretamente com a nossa situação. A Palavra é também a espada do Espírito na batalha espiritual.', 'Hebreus 4:12 · Efésios 6:17 · Jeremias 23:29'],
      ['Não basta ouvir, é preciso praticar', 'Tiago compara quem ouve a Palavra e não pratica a alguém que se olha no espelho e logo esquece como é. Jesus disse que quem ouve e pratica é como quem constrói a casa sobre a rocha: vêm as tempestades, e a casa permanece firme. O objetivo da leitura não é só saber mais, mas obedecer mais.', 'Tiago 1:22-25 · Mateus 7:24-27 · Josué 1:8']
    ],
    aprofundar: [
      'A Bíblia tem 66 livros divididos em duas partes. O Antigo Testamento (39 livros) conta a criação, a história do povo de Israel, as leis, os salmos, os profetas e as promessas da vinda do Messias. O Novo Testamento (27 livros) conta a vida de Jesus (nos Evangelhos), o começo da igreja (Atos), as cartas dos apóstolos e a revelação sobre o fim dos tempos (Apocalipse).',
      'Para começar, recomendamos o Evangelho de Marcos ou de João, porque mostram quem é Jesus. Depois, Atos e algumas cartas curtas, como Filipenses, Efésios e Tiago. Leia também um salmo e um trecho de Provérbios por dia. Evite começar por livros mais difíceis, como Levítico ou Apocalipse, sem acompanhamento.',
      'Um método simples para a leitura diária: 1) ore pedindo que o Espírito Santo ensine você; 2) leia um trecho curto com calma; 3) pergunte o que o texto mostra sobre Deus, o que ele mostra sobre mim e o que devo praticar; 4) anote um versículo e uma aplicação; 5) termine orando sobre o que leu.'
    ],
    duvidas: [
      ['Qual tradução da Bíblia devo usar?', 'Para começar, uma tradução em linguagem atual ajuda bastante, como a Nova Versão Internacional (NVI) ou a Nova Versão Transformadora (NVT). Muitos irmãos usam a Almeida Revista e Atualizada ou a Revista e Corrigida. O importante é ler e entender; pergunte na igreja qual é usada nos cultos.'],
      ['Não entendo muita coisa do que leio. É normal?', 'É normal e faz parte do crescimento. Anote as dúvidas e leve para o seu discipulador, para a célula ou para a Escola Bíblica. Peça ao Espírito Santo que abra o seu entendimento (Lucas 24:45).'],
      ['Posso usar a Bíblia no celular?', 'Pode. Há bons aplicativos gratuitos com planos de leitura e áudio. Só cuide para que as notificações não roubem a sua atenção no momento com Deus.']
    ],
    perguntas: [
      'Por que podemos confiar que a Bíblia é a Palavra de Deus?',
      'Como Jesus usou a Palavra quando foi tentado? O que isso ensina a você?',
      'Que diferença faz construir a vida sobre a rocha ou sobre a areia?',
      'Qual é o melhor momento do seu dia para ler a Bíblia?',
      'Qual versículo deste estudo você quer guardar no coração?'
    ],
    desafio: 'Comece a ler o Evangelho de Marcos, um capítulo por dia, usando o método dos cinco passos. Anote um versículo e uma aplicação de cada capítulo e leve as anotações para o próximo encontro com seu discipulador.',
    oracao: 'Senhor, obrigado pela tua Palavra. Dá-me fome e sede dela. Abre os meus olhos para ver as maravilhas da tua lei e o meu coração para obedecer. Que a tua Palavra seja luz no meu caminho e alimento para a minha alma. Amém.',
    memorizar: 'Salmos 119:105',
    semana: ['Salmos 1', 'Salmos 19', 'Salmos 119:1-24', 'Mateus 4:1-11', 'Mateus 7:24-29', 'Lucas 24:13-35', '2 Timóteo 3:10-17']
  },
  /* ------------------------------------------------------------ 6 */
  {
    titulo: 'Santificação: vivendo para agradar a Deus',
    resumo: 'Santificação é o processo em que o Espírito Santo nos torna cada dia mais parecidos com Jesus.',
    leitura: '1 Pedro 1:13-16 · Romanos 12:1-2 · Gálatas 5:16-25',
    intro: [
      'Quando você aceitou Jesus, Deus o separou para ele. Essa é a primeira ideia da palavra "santo": separado, pertencente a Deus. Assim como um objeto usado no templo era separado para uso sagrado, a sua vida agora pertence ao Senhor.',
      'Ao mesmo tempo, ser santo é um caminho de transformação. Deus nos aceita como estamos, mas nos ama demais para nos deixar como estamos. Ele trabalha em nós para que o caráter de Jesus apareça no nosso jeito de falar, pensar, reagir e viver.',
      'Neste estudo você vai entender o que é santificação, como ela acontece e quais áreas da vida o Espírito Santo quer transformar.'
    ],
    pontos: [
      ['Somos chamados para ser santos', 'Deus diz: "Sejam santos, porque eu sou santo". Isso não é um peso, mas um convite para viver no padrão do Reino. Santidade não é cara fechada nem lista de proibições; é a beleza do caráter de Deus refletida em nós. Jesus era santo e, ao mesmo tempo, o mais amoroso e acolhedor de todos.', '1 Pedro 1:15-16 · Hebreus 12:14 · 1 Tessalonicenses 4:3-7'],
      ['É obra do Espírito com a nossa participação', 'Não nos santificamos por esforço próprio, mas também não ficamos parados. Paulo diz para desenvolvermos a nossa salvação, porque é Deus quem opera em nós tanto o querer quanto o realizar. O Espírito dá a força; nós escolhemos obedecer, fugir das ocasiões de pecado e cultivar hábitos que nos aproximam de Deus.', 'Filipenses 2:12-13 · Gálatas 5:16-18 · 2 Coríntios 3:18'],
      ['Renovar a mente', 'Paulo pede que não nos conformemos com o padrão deste mundo, mas que sejamos transformados pela renovação da mente. Muito do que pensamos foi formado por experiências, mídia e cultura. A Palavra de Deus vai substituindo mentiras por verdades. O que entra pelos olhos e ouvidos influencia o coração: escolha bem o que você assiste, ouve e lê.', 'Romanos 12:2 · Filipenses 4:8 · Salmos 101:3'],
      ['O corpo é templo do Espírito', 'A Bíblia ensina que o nosso corpo é templo do Espírito Santo. Por isso, a santidade envolve a sexualidade, a forma como tratamos o corpo e os vícios. Deus criou o sexo como algo bom dentro do casamento entre homem e mulher, e nos chama a fugir da imoralidade. Também nos chama a não sermos dominados por nada, como álcool, drogas, pornografia ou jogos.', '1 Coríntios 6:12-20 · Hebreus 13:4 · Efésios 5:18'],
      ['O fruto do Espírito', 'A maior prova de santidade não é a aparência, mas o fruto: amor, alegria, paz, paciência, amabilidade, bondade, fidelidade, mansidão e domínio próprio. Fruto não aparece de um dia para o outro; cresce quando a árvore está ligada à videira. Quanto mais ligados a Jesus, mais esse fruto aparece.', 'Gálatas 5:22-23 · João 15:1-8']
    ],
    aprofundar: [
      'Em todo cristão existe uma luta entre a "carne" (a velha natureza, que deseja o que é contrário a Deus) e o Espírito. Paulo descreve essa luta em Gálatas 5 e em Romanos 7 e 8. A boa notícia é que não estamos sozinhos: quem anda no Espírito não satisfaz os desejos da carne. Vencer não é força de vontade, é dependência.',
      'Algumas atitudes práticas ajudam muito: fugir das situações de tentação (José fugiu da mulher de Potifar), ter amigos que caminham na mesma direção, confessar quando cair, encher a mente da Palavra e prestar contas a alguém maduro. A tentação perde força quando é trazida para a luz.',
      'Santificação também não é legalismo. Algumas igrejas criam regras sobre roupas e costumes que não estão na Bíblia. O que buscamos é um coração que ama a Deus e uma vida coerente com o evangelho, com modéstia, integridade e bom testemunho, sem julgar os outros pela aparência.'
    ],
    duvidas: [
      ['Caí no mesmo pecado de novo. Será que Deus desistiu de mim?', 'Não. Deus é paciente e continua trabalhando em você. Confesse, levante-se e procure ajuda para vencer essa área. Uma pessoa justa cai sete vezes e se levanta (Provérbios 24:16).'],
      ['Preciso me afastar dos meus amigos antigos?', 'Você não precisa deixar de amar ninguém; seus amigos precisam conhecer Jesus por meio de você. Mas precisa se afastar de ambientes e práticas que levam ao pecado. Más companhias corrompem os bons costumes (1 Coríntios 15:33). Busque novas amizades na igreja.'],
      ['Moro com meu namorado ou namorada. E agora?', 'É uma situação comum e que a igreja trata com amor e verdade. Converse com o pastor: ele vai orientar vocês sobre os passos para honrar a Deus, que pode incluir oficializar o casamento.']
    ],
    perguntas: [
      'Com as suas palavras, o que significa ser santo?',
      'Por que santificação não é só uma lista de proibições?',
      'Que conteúdos você consome que precisam ser revistos?',
      'Qual parte do fruto do Espírito você mais deseja ver crescer em você?',
      'Quem pode ser seu parceiro de oração e prestação de contas?'
    ],
    desafio: 'Faça uma lista do que você assiste, ouve e lê durante a semana. Peça ao Espírito Santo para mostrar o que deve sair e o que deve entrar. Escolha uma área de luta e combine com seu discipulador de orarem juntos por ela todas as semanas.',
    oracao: 'Espírito Santo, eu me entrego a ti. Transforma a minha mente, as minhas palavras e as minhas atitudes. Quero ser parecido com Jesus. Dá-me força para fugir do pecado e alegria em te obedecer. Faz crescer em mim o teu fruto. Amém.',
    memorizar: 'Romanos 12:2',
    semana: ['Romanos 12:1-21', '1 Pedro 1:13-25', 'Gálatas 5:13-26', 'Gênesis 39:1-23', '1 Coríntios 6:9-20', 'Filipenses 4:4-9', 'João 15:1-17']
  },
  /* ------------------------------------------------------------ 7 */
  {
    titulo: 'Dízimos, ofertas e generosidade',
    resumo: 'Tudo vem de Deus. Contribuir com fidelidade e alegria é adoração e parceria com a obra do Reino.',
    leitura: 'Malaquias 3:6-12 · 2 Coríntios 9:6-15 · Mateus 6:19-34',
    intro: [
      'Jesus falou muito sobre dinheiro. Não porque Deus precise do nosso dinheiro, mas porque o lugar onde está o nosso tesouro mostra onde está o nosso coração. A forma como lidamos com os recursos revela em quem confiamos.',
      'Desde Abraão, o povo de Deus reconhece que tudo vem do Senhor e devolve a ele uma parte, como gratidão e adoração. O dízimo (a décima parte) e as ofertas sustentam a casa de Deus, o cuidado com os necessitados e a pregação do evangelho.',
      'Neste estudo você vai entender o princípio da mordomia, o que a Bíblia ensina sobre dízimos e ofertas e como viver uma vida financeira saudável, livre da ganância e da ansiedade.'
    ],
    pontos: [
      ['Deus é o dono de tudo; nós somos administradores', 'A terra e tudo o que nela existe pertencem ao Senhor. Saúde, trabalho, talentos e salário são presentes dele. Não somos donos, somos mordomos: administramos o que é de Deus. Um dia prestaremos contas de como usamos o que ele nos confiou.', 'Salmos 24:1 · 1 Crônicas 29:11-14 · Mateus 25:14-30'],
      ['O dízimo é reconhecimento e fidelidade', 'Abraão entregou o dízimo a Melquisedeque antes mesmo da Lei. Em Malaquias, Deus chama o povo a trazer os dízimos à casa do tesouro e promete abrir as janelas do céu. Jesus confirmou que o dízimo não deve ser abandonado, desde que acompanhado de justiça, misericórdia e fidelidade. Entregar a primeira parte é declarar que Deus vem em primeiro lugar.', 'Gênesis 14:18-20 · Malaquias 3:10 · Mateus 23:23 · Provérbios 3:9-10'],
      ['Ofertas com alegria e generosidade', 'Além do dízimo, a Bíblia fala das ofertas voluntárias: para a obra, para missões, para ajudar quem precisa. Paulo ensina que cada um contribua conforme decidiu no coração, não com tristeza ou por obrigação, porque Deus ama quem dá com alegria. A viúva que entregou duas moedas foi elogiada por Jesus: ela deu tudo o que tinha.', '2 Coríntios 9:6-8 · Marcos 12:41-44 · Atos 4:32-35'],
      ['Semear e colher: Deus honra quem confia', 'Quem semeia pouco colhe pouco; quem semeia com fartura colhe com fartura. Deus é poderoso para fazer transbordar toda graça, de modo que tenhamos o necessário e ainda sobre para toda boa obra. Cremos que Deus abençoa quem é fiel, e essa bênção tem um propósito: sermos generosos e abençoarmos outros. Não damos para "comprar" milagres; damos porque confiamos e amamos.', '2 Coríntios 9:6-11 · Lucas 6:38 · Filipenses 4:15-19'],
      ['Cuidado com o amor ao dinheiro', 'O dinheiro é um bom servo, mas um péssimo senhor. Jesus disse que não podemos servir a Deus e às riquezas. O amor ao dinheiro é raiz de muitos males e leva pessoas a se desviarem da fé. A resposta é buscar primeiro o Reino, viver com contentamento e confiar que o Pai cuida de nós.', 'Mateus 6:24-33 · 1 Timóteo 6:6-10, 17-19 · Hebreus 13:5']
    ],
    aprofundar: [
      'Na igreja, os dízimos e ofertas são usados com transparência para manter o templo, sustentar o trabalho pastoral, apoiar missões, ajudar famílias em necessidade e realizar a obra. A tesouraria registra tudo e presta contas. Você pode perguntar à liderança como os recursos são aplicados.',
      'Fidelidade financeira também inclui organização: gastar menos do que ganha, evitar dívidas desnecessárias, pagar o que deve, ser honesto no trabalho e nos impostos e planejar o futuro. Deus abençoa o trabalho das mãos de quem é diligente. Se você está endividado, procure ajuda: a igreja pode orientar sobre como reorganizar a vida financeira.',
      'Um equilíbrio importante: cremos que Deus abençoa e prospera os seus filhos, inclusive materialmente, mas a maior riqueza é a vida com Deus. Prosperidade bíblica não é ostentação, e sim ter o suficiente, viver em paz e ser generoso. Nunca contribua por pressão ou como troca: entregue com fé, gratidão e alegria.'
    ],
    duvidas: [
      ['O dízimo é sobre o salário bruto ou líquido?', 'O princípio é entregar a décima parte do que você recebe como renda, com coração grato. Muitos irmãos calculam sobre o que efetivamente recebem. O mais importante é a fidelidade e a sinceridade diante de Deus; se tiver dúvidas, converse com o pastor.'],
      ['Estou desempregado ou com dívidas. Devo dizimar?', 'O dízimo é sobre o que você recebe; se não há renda, não há dízimo. Em tempo de dificuldade, comece com o que puder, com fé, e organize as finanças com ajuda. Deus vê o coração.'],
      ['Posso entregar o dízimo pelo Pix?', 'Sim. A igreja aceita contribuições em dinheiro, Pix e transferência, e a tesouraria registra cada lançamento.']
    ],
    perguntas: [
      'O que significa ser administrador, e não dono, dos seus recursos?',
      'Por que Deus pede a primeira parte, e não o que sobra?',
      'Qual a diferença entre dar com alegria e dar por obrigação ou interesse?',
      'Em que área da sua vida financeira você precisa confiar mais em Deus?',
      'Como você pode ser generoso com alguém nesta semana?'
    ],
    desafio: 'Escreva o seu orçamento do mês: quanto entra, quanto sai e para onde. Separe em primeiro lugar o dízimo e uma oferta. Escolha um gesto de generosidade concreto nesta semana, como ajudar alguém com uma cesta, uma conta ou uma refeição.',
    oracao: 'Senhor, tudo o que eu tenho vem de ti. Ensina-me a ser fiel e generoso. Livra-me da ganância e da ansiedade. Quero buscar em primeiro lugar o teu Reino, confiando que tu cuidas de mim. Abençoa o trabalho das minhas mãos para que eu possa abençoar muitos. Amém.',
    memorizar: 'Provérbios 3:9-10',
    semana: ['Gênesis 14:17-24', 'Malaquias 3:6-12', 'Mateus 6:19-34', 'Marcos 12:41-44', 'Lucas 12:13-34', '2 Coríntios 9:6-15', '1 Timóteo 6:6-19']
  },
  /* ------------------------------------------------------------ 8 */
  {
    titulo: 'Congregar: a igreja como família',
    resumo: 'Ninguém foi feito para seguir Jesus sozinho. Na igreja local encontramos família, cuidado, ensino e propósito.',
    leitura: 'Atos 2:42-47 · Hebreus 10:23-25 · 1 Coríntios 12:12-27',
    intro: [
      'Quando você aceitou Jesus, não ganhou apenas um Pai: ganhou também irmãos. A Bíblia chama a igreja de família de Deus, corpo de Cristo e templo do Espírito. Todas essas imagens mostram que a fé cristã é vivida em comunidade.',
      'Uma brasa separada da fogueira esfria rápido. Do mesmo modo, o cristão que se isola fica vulnerável ao desânimo, às dúvidas e às tentações. Congregar não é só ir a um culto: é pertencer, cuidar e ser cuidado.',
      'Neste estudo você vai ver como era a vida da primeira igreja, por que a igreja local é importante e como se integrar à família da Comunidade Cristã Livres em Cristo.'
    ],
    pontos: [
      ['A igreja é a família de Deus', 'Não somos mais estrangeiros, mas membros da família de Deus. Na igreja, Deus coloca pais e mães na fé, irmãos e irmãs, e também filhos espirituais. Isso não significa que a igreja seja perfeita: ela é feita de pessoas em processo, como você. Mas é ali que Deus escolheu nos fazer crescer.', 'Efésios 2:19-22 · Marcos 3:31-35 · 1 Timóteo 5:1-2'],
      ['O modelo da primeira igreja', 'Depois do Pentecostes, os novos convertidos perseveravam no ensino dos apóstolos, na comunhão, no partir do pão e nas orações. Reuniam-se no templo e também nas casas, com alegria. Havia sinais e maravilhas, generosidade com os necessitados e o Senhor acrescentava pessoas todos os dias. É esse modelo que buscamos viver nos cultos e nas células.', 'Atos 2:42-47 · Atos 4:32-35'],
      ['Não deixar de congregar', 'O autor de Hebreus alerta para não abandonarmos as reuniões, como alguns têm o costume de fazer, mas nos encorajarmos uns aos outros. A presença no culto e na célula não é obrigação religiosa: é onde recebemos a Palavra, adoramos juntos, somos fortalecidos e também fortalecemos outros.', 'Hebreus 10:23-25 · Salmos 122:1 · Mateus 18:20'],
      ['Cada membro tem uma função', 'Paulo compara a igreja a um corpo: cada parte é diferente e todas são necessárias. Ninguém é sem importância e ninguém faz tudo sozinho. Deus deu dons a cada um para servir os outros. Você também tem um lugar no corpo: na recepção, no louvor, com as crianças, na intercessão, na mídia, no evangelismo.', '1 Coríntios 12:12-27 · Romanos 12:4-8 · 1 Pedro 4:10-11'],
      ['Liderança, cuidado e a Ceia do Senhor', 'Deus estabeleceu pastores e líderes para cuidar, ensinar e proteger o rebanho, e pede que os honremos e sejamos ensináveis. Na Ceia do Senhor, os membros lembram a morte de Jesus, examinam o coração e celebram a comunhão como um só corpo, até que ele volte.', 'Hebreus 13:17 · Efésios 4:11-16 · 1 Coríntios 11:23-29']
    ],
    aprofundar: [
      'Na nossa igreja, a vida comunitária acontece em três ambientes. No culto, reunimo-nos todos para adorar e ouvir a Palavra. Na célula ou grupo familiar, nos reunimos em casas, em grupos menores, para conversar, orar e cuidar uns dos outros. No ministério, servimos juntos com os nossos dons. Quem participa dos três cresce muito mais rápido.',
      'Conflitos vão acontecer, porque somos humanos. Jesus ensinou um caminho: conversar diretamente com a pessoa, com humildade; se não resolver, buscar ajuda de alguém maduro; e nunca espalhar comentários. Fofoca destrói famílias e igrejas. Perdoar e buscar a paz é sinal de maturidade.',
      'A Jornada da Alma, usada pela nossa igreja, ajuda cada pessoa a dar os próximos passos: depois destes estudos vem o discipulado, o batismo, a vida de membro, a formação e o serviço ministerial. Você não está sozinho: há sempre alguém acompanhando você.'
    ],
    duvidas: [
      ['Posso acompanhar os cultos pela internet em vez de ir?', 'A transmissão é uma bênção para quem está doente, viajando ou impedido. Mas não substitui a comunhão presencial: o abraço, a oração juntos, o cuidado e o serviço. Use a internet como complemento, não como substituto.'],
      ['Alguém da igreja me magoou. O que faço?', 'Converse com a pessoa com calma ou procure seu discipulador ou um líder. Não deixe uma ferida afastar você de Deus nem da família da fé. Lembre-se de que a igreja é um hospital de pessoas em tratamento.'],
      ['Como faço para entrar numa célula ou ministério?', 'Fale com seu discipulador ou com a secretaria. A equipe vai ajudar você a encontrar uma célula perto da sua casa e um ministério que combine com os seus dons.']
    ],
    perguntas: [
      'O que mais chama a sua atenção na vida da primeira igreja?',
      'Por que é perigoso seguir Jesus sozinho?',
      'Qual parte do "corpo" você imagina que poderia ser? Por quê?',
      'Você já participa de uma célula? Se não, o que impede?',
      'Como você pode encorajar um irmão nesta semana?'
    ],
    desafio: 'Participe dos cultos desta semana e, se ainda não estiver numa célula, peça para conhecer uma. Converse com seu discipulador sobre um ministério em que você gostaria de servir e anote o nome e o telefone de dois irmãos para orar por eles.',
    oracao: 'Pai, obrigado por me dar uma família na fé. Ajuda-me a amar a tua igreja, a ser fiel nas reuniões e a servir com os dons que me deste. Livra-me da fofoca e da amargura e me faz um instrumento de paz e encorajamento. Amém.',
    memorizar: 'Hebreus 10:24-25',
    semana: ['Atos 2:37-47', 'Atos 4:32-37', 'Romanos 12:3-16', '1 Coríntios 12:12-31', 'Efésios 4:1-16', 'Hebreus 10:19-25', 'Mateus 18:15-22']
  },
  /* ------------------------------------------------------------ 9 */
  {
    titulo: 'O Espírito Santo: presença, batismo e dons',
    resumo: 'O Espírito Santo é Deus presente em nós. Ele nos guia, nos enche de poder e distribui dons para edificar a igreja.',
    leitura: 'João 14:15-27 · Atos 1:4-8 · Atos 2:1-21 · 1 Coríntios 12:1-11',
    intro: [
      'Antes de voltar para o Pai, Jesus disse aos discípulos que seria melhor para eles que ele fosse, porque então enviaria o Consolador. Ele mandou que esperassem em Jerusalém até serem revestidos de poder do alto. No dia de Pentecostes, o Espírito Santo foi derramado: os discípulos falaram em outras línguas, Pedro pregou com ousadia e cerca de três mil pessoas se converteram.',
      'O Espírito Santo não é uma força ou uma energia. Ele é uma pessoa divina: Deus, assim como o Pai e o Filho. Ele fala, ensina, guia, consola e pode ser entristecido. Quando você creu em Jesus, o Espírito passou a morar em você.',
      'Cremos que o mesmo Espírito que agiu no livro de Atos continua agindo hoje, enchendo os crentes de poder, distribuindo dons, curando enfermos e libertando os oprimidos. Neste estudo você vai conhecer o Espírito Santo e buscar mais da presença dele.'
    ],
    pontos: [
      ['O Espírito Santo é Deus e é nosso Ajudador', 'Jesus chamou o Espírito de Consolador ou Ajudador, alguém que fica ao nosso lado. Ele convence o mundo do pecado, nos guia em toda a verdade, nos lembra das palavras de Jesus e nos ajuda a orar. Ele é o selo de Deus em nós, a garantia de que pertencemos ao Senhor.', 'João 14:16-17, 26 · João 16:7-15 · Romanos 8:26-27 · Efésios 1:13-14'],
      ['O batismo no Espírito Santo é uma promessa para hoje', 'Além de habitar em todo crente, o Espírito quer nos encher e revestir de poder para testemunhar. Jesus chamou isso de ser batizado com o Espírito Santo. Pedro disse que a promessa é para nós, para nossos filhos e para todos os que o Senhor chamar. Muitos, ao serem cheios do Espírito, falam em línguas, como aconteceu em Atos; outros recebem ousadia, alegria e outros dons. O sinal mais importante é uma vida com poder para testemunhar e com o caráter de Cristo.', 'Atos 1:5, 8 · Atos 2:4, 38-39 · Atos 10:44-46 · Atos 19:1-6 · Efésios 5:18'],
      ['Como receber e ser cheio', 'Jesus ensinou que o Pai dá o Espírito Santo a quem pede. Para buscar essa experiência: tenha um coração arrependido e entregue; peça com fé, crendo na promessa; dedique tempo à oração e à adoração; não tenha medo do que Deus quer fazer. Ser cheio do Espírito não é uma experiência única: Efésios manda continuar sendo cheio, todos os dias.', 'Lucas 11:9-13 · João 7:37-39 · Atos 4:31 · Efésios 5:18-20'],
      ['Os dons do Espírito para edificar', 'O Espírito distribui dons a cada um, como ele quer, para o bem de todos: palavra de sabedoria, palavra de conhecimento, fé, dons de curar, operação de milagres, profecia, discernimento de espíritos, variedade de línguas e interpretação. Cremos que esses dons continuam hoje e devem ser buscados com zelo, exercidos com amor, ordem e submissão à Palavra e à liderança.', '1 Coríntios 12:4-11 · 1 Coríntios 14:1, 26-33, 40 · Romanos 12:6-8'],
      ['Poder para curar, libertar e testemunhar', 'Jesus enviou os discípulos para pregar o Reino, curar enfermos e expulsar demônios, e disse que sinais acompanhariam os que cressem. Oramos pelos enfermos com fé, crendo que Deus cura, e também respeitamos a medicina, que é uma graça de Deus. A autoridade sobre o mal vem do nome de Jesus e de uma vida submissa a Deus, não de fórmulas ou gritos.', 'Marcos 16:15-20 · Lucas 10:17-20 · Tiago 4:7 · Tiago 5:14-16 · Atos 3:1-10']
    ],
    aprofundar: [
      'O falar em línguas tem dois usos na Bíblia. Na oração pessoal, é uma linguagem de oração em que o espírito do crente fala com Deus e é edificado. Na reunião da igreja, uma mensagem em línguas deve ser acompanhada de interpretação, para que todos entendam. Paulo agradecia por falar em línguas mais do que todos, mas valorizava a profecia para edificar a igreja. Não é um troféu espiritual, e sim uma ferramenta de oração.',
      'Os dons são acompanhados pelo fruto. Paulo colocou o capítulo do amor (1 Coríntios 13) entre os capítulos dos dons para lembrar que, sem amor, nada somos. Uma pessoa pode ter dons impressionantes e um caráter imaturo. Por isso buscamos as duas coisas: o poder do Espírito e o fruto do Espírito.',
      'Também é importante discernir. Toda manifestação, profecia ou sonho deve concordar com a Bíblia e ser avaliado com humildade pela liderança. Deus não é Deus de confusão, mas de paz. Profecias não substituem a Palavra nem devem ser usadas para controlar ou manipular pessoas.'
    ],
    duvidas: [
      ['Se eu não falei em línguas, não tenho o Espírito Santo?', 'Todo aquele que crê em Jesus tem o Espírito Santo morando em si (Romanos 8:9). O batismo no Espírito é um revestimento de poder que você pode buscar com fé e expectativa. Muitos falam em línguas nessa experiência; continue pedindo, sem ansiedade e sem se comparar.'],
      ['Tenho medo de "perder o controle" ou de algo estranho acontecer.', 'O Espírito Santo é santo, bom e ordeiro. Ele não humilha nem força ninguém; o espírito do profeta está sujeito ao profeta (1 Coríntios 14:32). Busque com confiança: o Pai dá boas dádivas aos filhos (Lucas 11:11-13).'],
      ['Como descubro quais dons eu tenho?', 'Servindo, orando e ouvindo a confirmação de líderes maduros. Peça a Deus os melhores dons, participe das reuniões de oração e pergunte ao seu discipulador. A Escola de Obreiros ajuda a desenvolver os dons com segurança.']
    ],
    perguntas: [
      'O que muda na sua vida saber que o Espírito Santo é uma pessoa que mora em você?',
      'O que aconteceu com os discípulos depois do Pentecostes?',
      'Você já buscou ser batizado no Espírito Santo? Como foi?',
      'Por que os dons precisam caminhar junto com o amor?',
      'Por quem você vai orar pedindo cura ou libertação nesta semana?'
    ],
    desafio: 'Durante esta semana, separe um tempo de oração e adoração todos os dias pedindo para ser cheio do Espírito Santo. Participe da próxima reunião de oração da igreja e peça aos pastores ou líderes que orem por você para receber o batismo no Espírito Santo.',
    oracao: 'Espírito Santo, eu te dou boas-vindas na minha vida. Enche-me com a tua presença e com o teu poder. Batiza-me, Senhor Jesus, com o Espírito Santo, como prometeste. Distribui em mim os dons que quiseres para edificar a tua igreja e testemunhar com ousadia. E faz crescer em mim o teu fruto. Amém.',
    memorizar: 'Atos 1:8',
    semana: ['João 14:15-27', 'João 16:5-15', 'Atos 1:1-11', 'Atos 2:1-41', 'Atos 10:34-48', '1 Coríntios 12:1-11', '1 Coríntios 13:1-13']
  },
  /* ------------------------------------------------------------ 10 */
  {
    titulo: 'Firmes na fé: vencendo as lutas e seguindo em frente',
    resumo: 'A vida cristã tem batalhas, mas em Cristo somos mais que vencedores. Agora é hora de crescer e levar outros a Jesus.',
    leitura: 'Efésios 6:10-18 · Tiago 1:2-12 · 1 Coríntios 10:12-13 · Mateus 28:18-20',
    intro: [
      'Chegamos ao último estudo desta primeira fase. Você aprendeu sobre a certeza da salvação, o arrependimento, o batismo, a oração, a Palavra, a santificação, a generosidade, a igreja e o Espírito Santo. Agora precisamos falar de algo que todo cristão enfrenta: as lutas.',
      'Seguir Jesus não significa viver sem problemas. Jesus disse claramente que no mundo teríamos aflições, mas acrescentou: "tenham bom ânimo, eu venci o mundo". Haverá tentações, ataques espirituais, desânimo, perseguições e dias difíceis. A diferença é que agora não lutamos sozinhos.',
      'Neste estudo você vai conhecer a armadura de Deus, aprender a resistir ao inimigo, entender o propósito das provações e descobrir o próximo passo: crescer e ajudar outras pessoas a conhecerem Jesus.'
    ],
    pontos: [
      ['Existe uma batalha espiritual', 'A Bíblia ensina que a nossa luta não é contra pessoas, mas contra forças espirituais do mal. O diabo é real, mentiroso e acusador, e tenta roubar, matar e destruir. Mas ele já foi derrotado na cruz. Não vivemos com medo do inimigo; vivemos firmes na vitória de Jesus, sem dar lugar a ele pelo pecado, pela mágoa ou pelo envolvimento com o ocultismo.', 'Efésios 6:12 · João 10:10 · Colossenses 2:15 · Efésios 4:26-27 · 1 João 4:4'],
      ['A armadura de Deus', 'Paulo descreve a armadura completa: o cinto da verdade (viver na verdade), a couraça da justiça (vida reta), os calçados do evangelho (prontos para anunciar), o escudo da fé (que apaga os dardos inflamados), o capacete da salvação (mente protegida pela certeza de quem somos) e a espada do Espírito, que é a Palavra de Deus. Tudo isso unido à oração em todo tempo, no Espírito.', 'Efésios 6:13-18 · 2 Coríntios 10:3-5'],
      ['Resistir ao inimigo com autoridade', 'Tiago ensina uma ordem: sujeitem-se a Deus, resistam ao diabo, e ele fugirá. A autoridade vem da submissão. Jesus venceu a tentação citando a Palavra. Em nome de Jesus, podemos repreender o mal, romper com práticas do passado, como feitiçaria e ocultismo, e declarar as promessas de Deus. Se você tem objetos ligados a essas práticas, desfaça-se deles, como os crentes de Éfeso fizeram.', 'Tiago 4:7-8 · Mateus 4:1-11 · Lucas 10:19 · Atos 19:18-20'],
      ['As provações fortalecem a fé', 'Tiago diz para considerar motivo de alegria passar por várias provações, porque a prova da fé produz perseverança. Deus não manda o mal, mas usa até as situações difíceis para nos amadurecer. E ele é fiel: não deixa sermos tentados além do que podemos suportar e sempre prepara uma saída.', 'Tiago 1:2-4, 12 · Romanos 8:28, 35-39 · 1 Coríntios 10:13 · 1 Pedro 5:8-10'],
      ['Seguir em frente e fazer discípulos', 'Uma vida firme não fica parada. O próximo passo é continuar crescendo: discipulado, batismo, vida de membro, serviço e, um dia, discipular outras pessoas. A grande comissão de Jesus é para todos nós: ir e fazer discípulos. Comece por quem está perto: família, amigos, colegas. Conte o que Jesus fez na sua vida.', 'Mateus 28:18-20 · Filipenses 3:12-14 · 2 Timóteo 2:2 · Marcos 5:18-20']
    ],
    aprofundar: [
      'Os principais ataques contra um novo convertido costumam ser: dúvida ("isso não é real"), acusação ("você não presta"), desânimo ("não adianta"), isolamento ("você não precisa da igreja") e retorno ao passado ("só uma vez não faz mal"). Reconhecer essas estratégias ajuda a não cair nelas. Para cada mentira, responda com uma verdade da Palavra.',
      'O jejum é uma arma espiritual que Jesus praticou e ensinou. Jejuar é abrir mão de alimento por um tempo para buscar a Deus com mais intensidade. Comece com algo simples, como uma refeição, sempre com orientação e cuidado com a saúde. O jejum não "compra" nada de Deus, mas nos humilha diante dele e fortalece o espírito.',
      'Firmeza também vem de hábitos: oração diária, leitura bíblica, participação no culto e na célula, um discipulador por perto e um ministério para servir. Quem mantém esses hábitos atravessa as tempestades sem naufragar. E, quando cair, levanta-se e volta para o Pai: a graça de Deus é maior.'
    ],
    duvidas: [
      ['Desde que aceitei Jesus, os problemas aumentaram. Por quê?', 'Às vezes o inimigo reage quando alguém muda de lado. Outras vezes, Deus está tratando áreas que estavam escondidas. Não desanime: fique perto da igreja, peça oração e lembre-se de que maior é o que está em você.'],
      ['Tenho medo do diabo. Como lidar com isso?', 'O cristão não precisa viver com medo. Jesus já venceu, e você está nas mãos dele. Foque em Jesus, não no inimigo. Se houver sinais de opressão espiritual, procure os pastores para orar com você.'],
      ['Terminei os 10 estudos. E agora?', 'Parabéns! O próximo passo é o discipulado com um irmão mais experiente (8 lições), a classe de batismo e a integração numa célula e num ministério. Fale com quem acompanha você na igreja: a sua Jornada da Alma continua.']
    ],
    perguntas: [
      'Quais "dardos" o inimigo mais tem lançado contra você?',
      'Qual parte da armadura de Deus você mais precisa reforçar?',
      'Como uma provação do passado ajudou você a crescer?',
      'Quais hábitos vão manter você firme daqui para frente?',
      'Quem são três pessoas que você quer ver conhecendo Jesus?'
    ],
    desafio: 'Escreva os nomes de três pessoas que você quer levar a Jesus e ore por elas todos os dias. Convide uma delas para um culto ou para a sua célula. Converse com seu discipulador sobre os próximos passos: discipulado, batismo e ministério.',
    oracao: 'Senhor, obrigado por tudo o que aprendi. Revisto-me da tua armadura e me coloco debaixo da tua autoridade. Guarda-me firme na fé, mesmo nas lutas. Eu resisto ao mal em nome de Jesus. Usa a minha vida para levar outras pessoas a ti. Quero seguir em frente até o fim. Amém.',
    memorizar: 'Efésios 6:10-11',
    semana: ['Efésios 6:10-20', 'Mateus 4:1-11', 'Tiago 1:2-18', 'Romanos 8:28-39', '1 Pedro 5:6-11', 'Filipenses 3:7-14', 'Mateus 28:16-20']
  }
];
