// Livres Connect · Apostila da Escola de Obreiros e Líderes
// 8 lições para formar líderes, obreiros e discipuladores, na linha renovada
// (neopentecostal) da Comunidade Cristã Livres em Cristo. Uma aula por semana,
// de 90 a 120 minutos. Os versículos aparecem como referências para leitura
// na Bíblia; os textos são próprios do sistema.
//
// Campos de cada lição:
//   titulo, objetivo, leitura, versiculo     · cabeçalho
//   intro[]                                  · introdução
//   secoes[{ t, p[], refs }]                 · desenvolvimento do estudo
//   caso                                     · estudo de caso para a turma discutir
//   perguntas[]                              · perguntas para discussão
//   pratica                                  · tarefa da semana
//   revisao[]                                · perguntas de revisão (podem virar prova)
//   professor[]                              · orientações para quem dá a aula
// Para alterar uma lição, edite o texto abaixo e publique.

export const CURSO = {
  nome: 'Escola de Obreiros e Líderes',
  subtitulo: 'Formação para servir, cuidar de pessoas e multiplicar discípulos',
  apresentacao: [
    'Esta apostila acompanha a Escola de Obreiros da Comunidade Cristã Livres em Cristo. Ela é para quem já é membro, ama a igreja e sente o chamado de Deus para servir com mais responsabilidade: líderes de célula e de ministério, obreiros, diáconos, missionários, evangelistas e discipuladores.',
    'Liderança no Reino de Deus não é cargo, status ou poder. É serviço, exemplo e cuidado com pessoas, feito no poder do Espírito Santo. Por isso, as oito lições tratam primeiro do coração do líder (chamado, caráter, intimidade com Deus e unção) e depois da prática (cuidar, discipular, trabalhar em equipe e se proteger).',
    'Cada lição traz o texto para estudo, um caso real para a turma discutir, perguntas, uma tarefa prática para a semana e perguntas de revisão. Para ser aprovado, o aluno precisa da frequência e da média mínimas definidas pela coordenação e de cumprir as tarefas práticas.'
  ]
};

export const LICOES_ESCOLA = [
  /* ------------------------------------------------------------ 1 */
  {
    titulo: 'O chamado e o caráter do líder',
    objetivo: 'Entender que a liderança cristã nasce de um chamado de Deus e se sustenta pelo caráter, e avaliar a própria vida à luz dos requisitos bíblicos.',
    leitura: '1 Timóteo 3:1-13 · Tito 1:5-9 · 1 Samuel 16:1-13',
    versiculo: '1 Samuel 16:7',
    intro: [
      'Quando Deus mandou Samuel ungir um novo rei, o profeta olhou para Eliabe, alto e de boa aparência, e pensou: "Com certeza é este". Deus respondeu que não via como o homem vê: o homem olha a aparência, mas o Senhor olha o coração. O escolhido foi Davi, o mais novo, que estava cuidando das ovelhas.',
      'Essa história revela o princípio central desta lição: Deus escolhe líderes pelo coração. Talento, carisma e conhecimento são úteis, mas não sustentam ninguém por muito tempo. O que sustenta um líder é o chamado de Deus e um caráter moldado por ele.',
      'Muitos ministérios caem não por falta de dons, mas por falhas de caráter. Por isso começamos a Escola olhando para dentro: quem Deus chama, como ele prepara e que tipo de vida se espera de quem cuida do rebanho.'
    ],
    secoes: [
      { t: 'Liderança é chamado, não conquista', p: [
        'Na Bíblia, quem lidera é chamado por Deus: Moisés no deserto, Gideão escondido no lagar, Jeremias ainda jovem, os doze à beira do mar. Ninguém se candidatou; foram convidados. O chamado tira de nós a necessidade de provar valor e nos coloca na posição de servos que respondem a um Senhor.',
        'O chamado costuma vir acompanhado de três sinais: um desejo interior de servir, que Paulo chama de "aspirar ao episcopado" (1 Timóteo 3:1); a confirmação da igreja, quando líderes maduros reconhecem os dons e o fruto; e as portas que Deus abre ao longo do caminho. Desconfie de um chamado que só você enxerga e que despreza a orientação dos seus pastores.',
        'Também é importante lembrar que todo cristão é chamado para servir. Alguns são chamados para funções de maior responsabilidade, mas ninguém está acima dos outros. Jesus chamou os doze primeiro "para que estivessem com ele" e só depois "para os enviar" (Marcos 3:14). Antes de fazer para Deus, estamos com Deus.'
      ], refs: 'Êxodo 3:1-12 · Juízes 6:11-16 · Jeremias 1:4-10 · Marcos 3:13-15 · Efésios 4:11-12' },
      { t: 'Os requisitos de caráter', p: [
        'Quando Paulo orienta Timóteo e Tito sobre quem pode liderar, a lista é surpreendente: quase tudo é sobre caráter, e quase nada sobre talento. O líder deve ser irrepreensível (sem acusação justa contra ele), fiel no casamento, equilibrado, sensato, respeitável, hospitaleiro, apto para ensinar, não dado ao vinho, não violento, mas amável, pacífico, não apegado ao dinheiro, bom administrador da própria casa, não recém-convertido e com bom testemunho dos de fora.',
        'Essa lista não descreve pessoas perfeitas, mas pessoas maduras, cuja vida não contradiz aquilo que ensinam. Ela também mostra que a primeira escola de liderança é a própria casa: quem não cuida da família dificilmente cuidará bem da igreja.',
        'Repare na expressão "não recém-convertido". Dar responsabilidade cedo demais pode inflar o orgulho e expor a pessoa a quedas. Na nossa igreja, a Jornada da Alma existe justamente para que cada um cresça por etapas: membro, formação e serviço.'
      ], refs: '1 Timóteo 3:1-13 · Tito 1:5-9 · 1 Timóteo 5:22 · 1 Pedro 5:1-4' },
      { t: 'Deus forma o líder no secreto', p: [
        'Davi foi ungido rei, mas voltou a cuidar de ovelhas. Antes do trono, enfrentou leões, ursos, Golias, a inveja de Saul, cavernas e traições. José passou por poço, escravidão e prisão antes de governar o Egito. Moisés passou quarenta anos no deserto. Deus não tem pressa em formar quem vai usar.',
        'O deserto é a escola do caráter. Ali aprendemos a depender de Deus, a ser fiéis no pouco, a obedecer quando ninguém vê e a lidar com as nossas motivações. Jesus ensinou que quem é fiel no pouco será colocado sobre o muito. Muitas vezes, a tarefa que você acha pequena é exatamente o lugar onde Deus está testando o seu coração.',
        'Por isso, um líder em formação não deve desprezar a fila de cadeiras, a limpeza, o portão ou a criança que precisa de atenção. É servindo ali que se aprende a servir em qualquer lugar.'
      ], refs: '1 Samuel 16:11-13; 17:34-37 · Gênesis 37-41 · Lucas 16:10 · Zacarias 4:10' },
      { t: 'Integridade: a mesma pessoa em todo lugar', p: [
        'Integridade vem de "inteiro": é ser a mesma pessoa no púlpito, em casa, no trabalho e no celular. O líder íntegro não tem uma vida escondida. Ele pode errar, mas não vive de aparência.',
        'Daniel é um exemplo. Seus inimigos procuraram um motivo para acusá-lo e não encontraram, porque ele era fiel. A única acusação possível foi a sua fé. Esse é o testemunho que desejamos: que, se alguém nos acusar, seja por amarmos a Deus, e não por mentiras, dívidas, grosserias ou imoralidade.',
        'Integridade também inclui cumprir a palavra, chegar no horário, devolver o que pegou emprestado, prestar contas do dinheiro e reconhecer os próprios erros. Pequenas incoerências repetidas destroem a confiança que as pessoas depositam no líder.'
      ], refs: 'Daniel 6:1-5 · Salmos 15 · Provérbios 10:9 · Mateus 5:37' },
      { t: 'A autoridade espiritual vem da submissão', p: [
        'O centurião que pediu a Jesus que curasse o seu servo entendeu algo profundo: "eu também sou homem sujeito à autoridade". Quem quer exercer autoridade precisa estar debaixo de autoridade. Um líder que não se submete aos seus pastores ensina, com o próprio exemplo, rebeldia aos que lidera.',
        'Submissão não é servilismo nem silêncio diante do erro. É honrar a liderança, ser ensinável, cumprir combinados, levar discordâncias pelo caminho certo e não formar grupos à parte. Na igreja, ninguém lidera sozinho: todos prestamos contas a alguém, e o pastor presta contas a Deus.'
      ], refs: 'Mateus 8:5-10 · Hebreus 13:7, 17 · Romanos 13:1 · 1 Pedro 5:5-6' }
    ],
    caso: 'Paulo é um jovem talentoso: canta bem, prega com desenvoltura e todos gostam dele. Há seis meses foi convidado para liderar o ministério de jovens. Recentemente, a liderança soube que ele tem chegado atrasado, desmarca encontros em cima da hora, fala mal de outros líderes nas conversas e está com várias dívidas atrasadas com irmãos da igreja. Ele diz que "o importante é que os jovens estão crescendo". Discutam: o que está acontecendo? Como os pastores deveriam conversar com ele? Que passos ajudariam Paulo a crescer em caráter sem desistir do chamado?',
    perguntas: [
      'Por que Deus valoriza mais o caráter do que o talento?',
      'Qual requisito de 1 Timóteo 3 mais desafia você hoje? Por quê?',
      'Você reconhece um "deserto" na sua história? O que Deus formou em você ali?',
      'Que sinais mostram que alguém está pronto para mais responsabilidade?',
      'Como você reage quando é corrigido por um líder?'
    ],
    pratica: 'Leia 1 Timóteo 3:1-13 e Tito 1:5-9 e faça uma autoavaliação sincera, dando uma nota de 1 a 5 para cada qualidade. Escolha as duas mais fracas e escreva um plano prático para crescer nelas. Compartilhe esse plano com seu líder ou discipulador e peça que ele acompanhe você durante o curso.',
    revisao: [
      'Quais são os três sinais que costumam acompanhar um chamado verdadeiro?',
      'Cite cinco requisitos de caráter para o líder segundo 1 Timóteo 3 ou Tito 1.',
      'Por que Paulo diz que o líder não deve ser recém-convertido?',
      'O que é integridade? Dê um exemplo prático.',
      'Explique a frase: "quem quer exercer autoridade precisa estar debaixo de autoridade".'
    ],
    professor: [
      'Sugestão de aula (100 min): acolhida e oração (10), leitura de 1 Samuel 16 (10), exposição das seções 1 e 2 (30), caso em grupos de 4 a 5 pessoas (25), seções 3 a 5 (15), tarefa e oração de consagração (10).',
      'Crie um ambiente de sinceridade: conte uma experiência sua de formação no "deserto". A autoavaliação é pessoal; ninguém precisa expor notas para a turma.',
      'Explique os critérios de aprovação da Escola (frequência, média e tarefas) logo nesta primeira aula.'
    ]
  },
  /* ------------------------------------------------------------ 2 */
  {
    titulo: 'Liderança serva: o modelo de Jesus',
    objetivo: 'Compreender que no Reino de Deus liderar é servir, e aprender com Jesus a usar a autoridade para levantar pessoas.',
    leitura: 'Marcos 10:35-45 · João 13:1-17 · Filipenses 2:1-11',
    versiculo: 'Marcos 10:45',
    intro: [
      'Tiago e João pediram a Jesus os lugares de honra no Reino: um à direita e outro à esquerda. Os outros discípulos ficaram indignados, provavelmente porque queriam a mesma coisa. Jesus aproveitou a discussão para ensinar a lição mais importante sobre liderança.',
      'Ele explicou que, no mundo, os governantes dominam e os grandes exercem poder. "Entre vocês não será assim", disse. Quem quiser ser grande deve ser servo, e quem quiser ser o primeiro deve ser escravo de todos. E deu a si mesmo como exemplo: o Filho do Homem não veio para ser servido, mas para servir e dar a sua vida.',
      'Liderança serva não é fraqueza nem ausência de autoridade. Jesus tinha toda a autoridade e a usou para lavar pés, curar, ensinar, perdoar e dar a vida. É esse modelo que queremos aprender.'
    ],
    secoes: [
      { t: 'Dois modelos de liderança', p: [
        'O modelo do mundo é a pirâmide: o líder está no topo e as pessoas existem para servir os objetivos dele. O modelo de Jesus é a pirâmide invertida: o líder está na base, sustentando, servindo e fazendo os outros crescerem.',
        'No primeiro modelo, as pessoas são ferramentas. No segundo, as pessoas são o propósito. Um líder do mundo pergunta: "O que essas pessoas podem fazer por mim e pelo meu projeto?". Um líder servo pergunta: "O que eu posso fazer para que essas pessoas cresçam e cumpram o propósito de Deus?".',
        'Isso não significa que o líder não tenha metas, cobre resultados ou tome decisões. Jesus tinha uma missão clara, corrigiu discípulos e confrontou o erro. A diferença está na motivação e no método: tudo é feito por amor e para o bem das pessoas e do Reino.'
      ], refs: 'Marcos 10:42-45 · Mateus 20:20-28 · Lucas 22:24-27' },
      { t: 'A toalha e a bacia', p: [
        'Na última ceia, Jesus sabia que o Pai tinha colocado tudo em suas mãos. Justamente por saber quem era, de onde vinha e para onde ia, ele se levantou, tirou a capa, pegou uma toalha e lavou os pés dos discípulos, inclusive de Judas.',
        'Essa cena ensina que o serviço nasce da segurança. Quem não sabe quem é precisa de títulos, palco e reconhecimento. Quem tem identidade firme em Deus pode se abaixar sem medo de perder valor. Inseguranças geram líderes controladores; identidade gera líderes servos.',
        'Jesus terminou dizendo: "Eu dei o exemplo, para que vocês façam como eu fiz". Liderar servindo é praticado em gestos concretos: chegar antes para arrumar, ficar depois para recolher, visitar o doente, ouvir com paciência, ajudar na mudança de um irmão, cobrir a ausência de alguém sem reclamar.'
      ], refs: 'João 13:1-17 · 1 Pedro 5:5' },
      { t: 'O esvaziamento de Cristo', p: [
        'Paulo descreve a atitude de Jesus: sendo Deus, não se apegou à sua posição, mas esvaziou-se, assumiu a forma de servo, humilhou-se e foi obediente até a morte de cruz. Por isso Deus o exaltou acima de tudo.',
        'O caminho do Reino é sempre esse: descer para subir, perder para ganhar, morrer para viver. O líder que busca exaltação acaba humilhado; o que se humilha é exaltado no tempo de Deus. Isso nos livra da ansiedade de construir a própria imagem.',
        'Na prática, o esvaziamento aparece quando dividimos o crédito, celebramos o sucesso dos outros, aceitamos tarefas sem visibilidade e não usamos a posição para benefício próprio.'
      ], refs: 'Filipenses 2:1-11 · Tiago 4:10 · 1 Pedro 5:6' },
      { t: 'Servir não é agradar a todos', p: [
        'Um erro comum é confundir liderança serva com fazer tudo o que as pessoas querem. Jesus serviu as multidões, mas também se retirou para orar, disse "não" a pedidos, repreendeu Pedro e não negociou a verdade. Ele servia à vontade do Pai, não aos caprichos de cada um.',
        'O líder servo também cuida de si mesmo para não esgotar, sabe delegar e estabelece limites saudáveis. Servir a todos não é fazer tudo por todos: é fazer o que é melhor para o crescimento das pessoas, mesmo que às vezes signifique dizer "não" ou confrontar com amor.'
      ], refs: 'Marcos 1:35-38 · Mateus 16:21-23 · João 5:19, 30 · Gálatas 1:10' },
      { t: 'Autoridade para levantar, não para dominar', p: [
        'Pedro, que um dia quis o melhor lugar, escreveu mais tarde aos presbíteros: pastoreiem o rebanho de Deus de boa vontade, não por ganância, sem dominar os que lhes foram confiados, mas sendo exemplos. A autoridade espiritual é um depósito confiado por Deus para edificar, e não para destruir.',
        'Sinais de abuso de autoridade incluem: controlar a vida pessoal das pessoas além do que é saudável, usar o medo, exigir lealdade cega, não aceitar perguntas, expor publicamente quem erra e usar a posição para obter vantagens. Um líder servo cria um ambiente seguro, onde as pessoas podem falar, errar, ser corrigidas com amor e crescer.'
      ], refs: '1 Pedro 5:1-4 · 2 Coríntios 10:8; 13:10 · Ezequiel 34:1-10' }
    ],
    caso: 'Márcia lidera uma célula há dois anos. Ela é muito dedicada: prepara tudo, faz o lanche, ministra a palavra, ora por todos, visita, organiza os aniversários. Ultimamente está exausta, irritada com o grupo e pensando em desistir. Ninguém mais na célula assume responsabilidades, e ela sente que "se eu não fizer, ninguém faz". Discutam: Márcia está sendo uma líder serva? O que ela pode mudar? Como servir as pessoas sem fazer tudo por elas?',
    perguntas: [
      'Quais atitudes do "modelo da pirâmide" ainda aparecem na nossa forma de liderar?',
      'Por que a segurança da identidade em Deus nos liberta para servir?',
      'Em que situações dividir o crédito ou servir sem ser visto é difícil para você?',
      'Qual a diferença entre servir e agradar a todos?',
      'Como reconhecer um ambiente de abuso de autoridade? Como evitar criá-lo?'
    ],
    pratica: 'Nesta semana, faça três atos de serviço anônimos ou sem visibilidade na igreja ou na sua casa. Além disso, converse com uma pessoa que você lidera e pergunte: "Como posso servir melhor você?". Anote a resposta e o que aprendeu.',
    revisao: [
      'Explique a diferença entre o modelo de liderança do mundo e o de Jesus.',
      'O que o gesto de lavar os pés ensina sobre identidade e serviço?',
      'Resuma Filipenses 2:5-11 com suas palavras.',
      'Por que servir não significa fazer tudo o que as pessoas querem?',
      'Cite três sinais de abuso de autoridade.'
    ],
    professor: [
      'Sugestão: comece com uma dinâmica em que o professor serve a turma (água, lanche ou até lavar as mãos de alguns alunos com uma bacia e uma toalha), antes de explicar a lição.',
      'No caso da Márcia, ajude a turma a perceber a diferença entre servir e centralizar. Isso prepara a lição 6, sobre formar novos líderes.',
      'Termine com um momento de oração em duplas: cada aluno ora pelo ministério do colega.'
    ]
  },
  /* ------------------------------------------------------------ 3 */
  {
    titulo: 'A vida secreta do líder: intimidade com Deus',
    objetivo: 'Fortalecer a vida devocional do líder, entendendo que o ministério público é fruto da comunhão secreta com Deus.',
    leitura: 'Marcos 1:32-39 · Lucas 10:38-42 · João 15:1-11 · Salmos 63',
    versiculo: 'João 15:5',
    intro: [
      'Depois de uma noite inteira atendendo multidões, curando doentes e libertando oprimidos, Jesus levantou-se de madrugada, ainda escuro, e foi a um lugar deserto para orar. Quando os discípulos o encontraram e disseram "todos estão procurando por você", ele já sabia para onde ir: tinha recebido direção do Pai.',
      'O maior perigo para um líder não é a falta de agenda, mas uma agenda cheia de atividades para Deus e vazia da presença de Deus. É possível pregar, organizar eventos, aconselhar pessoas e, ao mesmo tempo, estar espiritualmente seco.',
      'Esta lição trata do que ninguém vê: a vida devocional do líder. Ela é a raiz; o ministério é o fruto. Árvores com raízes rasas caem na primeira tempestade.'
    ],
    secoes: [
      { t: 'Estar com ele antes de fazer para ele', p: [
        'Marta estava ocupada servindo Jesus, enquanto Maria estava sentada aos pés dele, ouvindo. Marta reclamou, e Jesus respondeu que Maria tinha escolhido a melhor parte. O serviço de Marta não era errado, mas estava fora de ordem: ela estava tão ocupada trabalhando para Jesus que se esqueceu de estar com Jesus.',
        'Muitos líderes são "Martas": cansados, ansiosos e irritados com quem não trabalha tanto quanto eles. A cura é voltar aos pés do Mestre. Ministério que não nasce da intimidade vira ativismo religioso.'
      ], refs: 'Lucas 10:38-42 · Marcos 3:14 · Salmos 27:4' },
      { t: 'Permanecer na videira', p: [
        'Jesus usou a imagem da videira: ele é a videira, nós somos os ramos. O ramo não produz fruto por esforço próprio, mas porque está ligado à videira e recebe a seiva. "Sem mim, vocês não podem fazer nada."',
        'Permanecer significa manter uma ligação contínua: a Palavra habitando em nós, a oração constante, a obediência e o amor. O resultado prometido é fruto que permanece, orações respondidas e alegria completa. Já o ramo que se desliga seca, mesmo que por um tempo pareça verde.',
        'Note também que o Pai poda os ramos que dão fruto, para que deem mais. As podas (perdas, correções, temporadas difíceis) fazem parte da vida do líder fiel.'
      ], refs: 'João 15:1-11 · Salmos 1:1-3 · Jeremias 17:7-8' },
      { t: 'Disciplinas espirituais do líder', p: [
        'Oração diária: um tempo separado, com hora e lugar, incluindo adoração, gratidão, confissão, intercessão pelas pessoas que você lidera e escuta. Ore pelos membros da sua célula ou ministério pelo nome.',
        'Palavra: leitura bíblica sistemática (um plano anual, por exemplo), estudo para ensinar e meditação, que é ruminar um texto até que ele transforme a mente. O líder não pode viver apenas do que ouve nos cultos; precisa ter a sua própria fonte.',
        'Oração no Espírito e adoração: como igreja renovada, valorizamos orar em línguas para edificação pessoal, cantar ao Senhor em particular e buscar ser cheio do Espírito continuamente. Jejum periódico: Jesus jejuou e ensinou a jejuar; os líderes de Antioquia jejuavam e oravam quando o Espírito os direcionou. Descanso: o sábado é um presente de Deus. Líderes que não descansam acabam esgotados e pecando por cansaço.'
      ], refs: 'Mateus 6:6, 16-18 · Josué 1:8 · Judas 20 · 1 Coríntios 14:2, 4, 15 · Atos 13:1-3 · Marcos 6:31' },
      { t: 'Ouvir a voz de Deus', p: [
        'As ovelhas de Jesus ouvem a sua voz. Deus fala principalmente pela Palavra, mas também por meio do Espírito Santo no nosso interior, por meio de circunstâncias, conselhos de pessoas maduras, sonhos e profecias. Todo direcionamento deve ser confirmado pela Bíblia, pela paz no coração e, quando envolve outras pessoas, pela liderança.',
        'Um líder que ouve a Deus toma decisões com mais sabedoria, sabe quando falar e quando calar, percebe as necessidades das pessoas e tem coragem para obedecer mesmo quando é difícil.'
      ], refs: 'João 10:27 · 1 Samuel 3:1-10 · Atos 16:6-10 · Isaías 30:21 · Colossenses 3:15' },
      { t: 'Sinais de secura espiritual', p: [
        'Fique atento aos sinais: oração apenas em público, leitura bíblica só para preparar mensagens, irritação constante, cinismo, comparação com outros líderes, prazer no reconhecimento, dificuldade de adorar, tentações ganhando força e cansaço que não passa.',
        'Diante desses sinais, não esconda. Converse com seu pastor, reduza atividades por um tempo se for preciso, volte ao primeiro amor e busque renovação. Deus restaura líderes cansados: ele alimentou Elias debaixo do zimbro antes de lhe dar uma nova missão.'
      ], refs: 'Apocalipse 2:1-5 · 1 Reis 19:1-18 · Salmos 51:10-12' }
    ],
    caso: 'Roberto é líder de louvor. Ensaia duas vezes por semana, toca em três cultos e ainda trabalha o dia inteiro. Confessou ao pastor que não lembra a última vez que orou sozinho por mais de cinco minutos, que lê a Bíblia "só quando vai ministrar" e que se sente vazio depois dos cultos, mesmo quando "a presença de Deus foi forte". Discutam: quais os riscos dessa situação? Que plano realista ajudaria Roberto a reconstruir sua vida devocional?',
    perguntas: [
      'Você se identifica mais com Marta ou com Maria nesta fase?',
      'O que significa, na prática, "permanecer na videira"?',
      'Qual disciplina espiritual está mais fraca na sua vida? E a mais forte?',
      'Como você tem reconhecido a voz de Deus? Como confirma?',
      'Quais sinais de secura espiritual você já percebeu em si mesmo?'
    ],
    pratica: 'Monte e siga por sete dias o seu plano devocional: horário, lugar, leitura bíblica, lista de intercessão com o nome das pessoas que você lidera, tempo de adoração e de oração no Espírito. Faça um dia de jejum (uma ou duas refeições, conforme sua saúde) dedicado ao seu ministério. Anote o que Deus falar.',
    revisao: [
      'O que a história de Marta e Maria ensina sobre ministério?',
      'Explique a figura da videira e dos ramos.',
      'Cite cinco disciplinas espirituais do líder.',
      'Como confirmar se uma direção vem de Deus?',
      'Cite quatro sinais de secura espiritual.'
    ],
    professor: [
      'Faça desta aula um momento de busca: reserve os últimos 20 minutos para oração, adoração e ministração, pedindo renovação para os líderes.',
      'Compartilhe o seu próprio plano devocional. Alunos aprendem mais pelo exemplo do que por instrução.',
      'Na próxima aula, peça que dois alunos contem como foi a semana devocional.'
    ]
  },
  /* ------------------------------------------------------------ 4 */
  {
    titulo: 'Liderando no poder do Espírito Santo',
    objetivo: 'Compreender o papel do Espírito Santo no ministério, desenvolver os dons com maturidade e ministrar cura e libertação com responsabilidade bíblica.',
    leitura: 'Atos 1:8 · Atos 4:23-33 · 1 Coríntios 12-14 · Lucas 4:16-21',
    versiculo: 'Zacarias 4:6',
    intro: [
      'Jesus começou o seu ministério declarando: "O Espírito do Senhor está sobre mim, porque ele me ungiu para pregar boas-novas aos pobres, proclamar libertação aos presos, recuperação da vista aos cegos e libertar os oprimidos". Se o próprio Jesus dependeu da unção do Espírito, quanto mais nós.',
      'Depois de ressuscitado, Jesus mandou os discípulos esperarem o poder do alto antes de começar a missão. Liderança cristã não é apenas boa gestão ou boa comunicação; é cooperar com o que o Espírito Santo está fazendo.',
      'Como igreja renovada, cremos que os dons e sinais do livro de Atos continuam hoje. Mas também sabemos que o poder sem caráter e sem ordem causa feridas. Esta lição busca as duas coisas: fogo e maturidade.'
    ],
    secoes: [
      { t: 'Não por força, mas pelo Espírito', p: [
        'Zorobabel tinha a missão de reconstruir o templo em meio à oposição e à escassez. Deus lhe disse: "Não por força nem por poder, mas pelo meu Espírito". A obra de Deus não avança pela capacidade humana, mas pela ação do Espírito.',
        'Isso tira o peso dos ombros do líder. Não somos nós que convertemos, curamos ou transformamos. Nossa parte é orar, obedecer, pregar e ministrar; a parte de Deus é agir. Ao mesmo tempo, isso nos chama à dependência: um ministério sem oração é um ministério sem poder.'
      ], refs: 'Zacarias 4:6-7 · João 6:63 · 1 Coríntios 2:1-5 · 2 Coríntios 3:5-6' },
      { t: 'Cheios do Espírito continuamente', p: [
        'Os mesmos discípulos cheios do Espírito em Atos 2 foram cheios novamente em Atos 4, quando oraram diante das ameaças. Paulo manda os efésios continuarem sendo cheios do Espírito. A plenitude não é um evento único, é um estilo de vida.',
        'O líder deve buscar o batismo no Espírito Santo, se ainda não recebeu, e renovar-se constantemente. Sinais de uma vida cheia do Espírito: ousadia para testemunhar, alegria e adoração, sensibilidade à voz de Deus, operação de dons e, principalmente, o fruto do Espírito no caráter.'
      ], refs: 'Atos 2:4 · Atos 4:31 · Efésios 5:18-21 · Atos 6:3, 5 · Gálatas 5:22-25' },
      { t: 'Os dons na vida da igreja', p: [
        'Paulo lista nove manifestações do Espírito: palavra de sabedoria, palavra de conhecimento, fé, dons de curar, operação de milagres, profecia, discernimento de espíritos, variedade de línguas e interpretação de línguas. Ele mesmo resume o propósito: "a manifestação do Espírito é dada a cada um visando o bem comum".',
        'Algumas orientações para o líder: incentive o povo a buscar os dons; crie espaços seguros para que se manifestem (reuniões de oração, células); ensine que a profecia, no Novo Testamento, serve para edificar, exortar e consolar; avalie toda palavra profética pela Bíblia e com outros líderes; e nunca use "Deus me mostrou" para controlar, expor ou manipular alguém.',
        'Paulo coloca o capítulo do amor entre os capítulos dos dons. O amor é o caminho por onde os dons devem andar. Sem amor, línguas viram barulho, profecia vira nada e fé vira vaidade.'
      ], refs: '1 Coríntios 12:4-11 · 1 Coríntios 13 · 1 Coríntios 14:1-5, 26-33, 40 · 1 Tessalonicenses 5:19-21' },
      { t: 'Ministrando cura', p: [
        'Jesus curou enfermos e enviou os discípulos para fazerem o mesmo. Tiago orienta que o doente chame os presbíteros para orar sobre ele, ungindo-o com óleo em nome do Senhor, e promete que a oração da fé salvará o doente. Cremos que Deus cura hoje, e oramos pelos enfermos com fé e expectativa.',
        'Orientações práticas: pergunte à pessoa o que ela tem e se deseja oração; peça permissão antes de impor as mãos e respeite os limites do corpo (mãos na cabeça, ombro ou mão, nunca em partes íntimas); ore com fé e simplicidade, em nome de Jesus; não prometa cura nem culpe a pessoa pela falta de fé se ela não for curada; incentive a continuar o tratamento médico e a confirmar a cura com o médico. A medicina é graça de Deus, não inimiga da fé.'
      ], refs: 'Marcos 16:17-18 · Lucas 9:1-2 · Tiago 5:14-16 · Atos 3:1-10 · 2 Coríntios 12:7-10' },
      { t: 'Libertação com autoridade e sabedoria', p: [
        'Jesus expulsou demônios e deu essa autoridade aos discípulos. Paulo lembra que a nossa luta é espiritual. O líder precisa saber ministrar libertação, mas com equilíbrio: nem negar a realidade espiritual, nem enxergar demônio em tudo.',
        'Diretrizes: a autoridade vem do nome de Jesus e de uma vida santa, não de gritos ou fórmulas; ministre em equipe, com pelo menos duas pessoas, e nunca sozinho com alguém do sexo oposto; preserve a dignidade da pessoa (sem expor, filmar ou humilhar); conduza ao arrependimento, à renúncia de práticas ocultas e ao perdão; e acompanhe depois, porque a libertação precisa de discipulado. Problemas emocionais e psiquiátricos não devem ser tratados apenas como questão espiritual: quando houver sinais de transtorno, oriente a busca de ajuda profissional e informe o pastor.'
      ], refs: 'Lucas 10:17-20 · Marcos 9:14-29 · Atos 19:13-20 · Efésios 6:10-18 · Mateus 12:43-45' }
    ],
    caso: 'Numa reunião de célula, uma irmã visitante começa a chorar muito e a se debater durante a oração. Um membro empolgado grita para "o demônio sair", outro começa a filmar e uma terceira pessoa diz em voz alta que "Deus mostrou que ela tem um pecado escondido". A visitante sai assustada e não volta mais. Discutam: o que deu errado? Como o líder da célula deveria ter conduzido a situação? Que orientações a igreja precisa dar aos membros?',
    perguntas: [
      'O que significa liderar "não por força, mas pelo Espírito" no seu ministério?',
      'Quais dons você percebe em si mesmo? Como pode desenvolvê-los?',
      'Por que o amor é o caminho dos dons?',
      'Como orar por cura sem prometer o que só Deus pode fazer?',
      'Que cuidados são indispensáveis numa ministração de libertação?'
    ],
    pratica: 'Ore todos os dias desta semana pedindo para ser cheio do Espírito e por um dom específico (1 Coríntios 14:1). Ore por pelo menos um enfermo, com permissão e seguindo as orientações da lição, e registre o que aconteceu. Se ainda não recebeu o batismo no Espírito Santo, peça aos pastores que orem por você.',
    revisao: [
      'Qual o significado de Zacarias 4:6 para o líder?',
      'Cite as nove manifestações do Espírito de 1 Coríntios 12.',
      'Para que serve a profecia no Novo Testamento? Como avaliar uma profecia?',
      'Cite quatro orientações práticas para orar por enfermos.',
      'Cite quatro diretrizes para a ministração de libertação.'
    ],
    professor: [
      'Reserve tempo para ministração no final: ore pelos alunos para serem cheios do Espírito e para receberem dons. Faça isso com ordem e com a equipe pastoral presente.',
      'Reforce as regras de segurança: ministração em equipe, respeito ao corpo, sem filmagens, sem exposição e encaminhamento ao pastor dos casos delicados.',
      'Se possível, convide o pastor para participar desta aula.'
    ]
  },
  /* ------------------------------------------------------------ 5 */
  {
    titulo: 'Cuidando de pessoas: o coração do pastor',
    objetivo: 'Desenvolver o cuidado pastoral do líder: acompanhar, visitar, ouvir, aconselhar com sabedoria e saber encaminhar.',
    leitura: 'Ezequiel 34:1-16 · João 10:1-16 · 1 Pedro 5:1-4 · Lucas 15:1-7',
    versiculo: 'João 10:11',
    intro: [
      'Jesus se apresentou como o Bom Pastor: ele conhece as ovelhas pelo nome, vai à frente delas, as defende e dá a vida por elas. Também contou a história do pastor que deixa as noventa e nove para buscar a ovelha perdida e faz festa quando a encontra.',
      'Todo líder na igreja, seja de célula, de ministério ou discipulador, participa desse cuidado pastoral. As pessoas não são números de frequência; são ovelhas que Deus confiou às nossas mãos e pelas quais um dia prestaremos contas.',
      'Nesta lição vamos aprender a cuidar de pessoas na prática: conhecer, acompanhar, visitar, ouvir, aconselhar e saber quando encaminhar para o pastor ou para outros profissionais.'
    ],
    secoes: [
      { t: 'O que Deus espera dos pastores', p: [
        'Em Ezequiel 34, Deus repreende os líderes de Israel: eles se alimentavam das ovelhas em vez de alimentá-las, não fortaleceram as fracas, não curaram as doentes, não trouxeram de volta as desgarradas e governaram com dureza. Então Deus promete: "Eu mesmo buscarei as minhas ovelhas e cuidarei delas".',
        'Essa passagem é um retrato do que não fazer e, ao contrário, do que fazer: alimentar, fortalecer, curar, enfaixar, trazer de volta e buscar a perdida. É uma lista de verbos de cuidado que deve marcar a agenda de todo líder.'
      ], refs: 'Ezequiel 34:1-16 · Jeremias 3:15 · Atos 20:28' },
      { t: 'Conhecer as ovelhas pelo nome', p: [
        'O Bom Pastor conhece cada ovelha pelo nome. O líder precisa saber quem são as pessoas sob seu cuidado: nome, família, trabalho, situação espiritual, lutas e sonhos. Na nossa igreja, a ficha de cada pessoa e a Jornada da Alma ajudam nisso; use o sistema para registrar contatos e acompanhar quem está esfriando.',
        'Um bom hábito: rever a lista de pessoas toda semana, perguntando: quem não veio? Quem está passando por alguma dificuldade? Quem está pronto para o próximo passo? Uma mensagem pelo WhatsApp, uma ligação ou uma visita no tempo certo podem impedir que alguém se afaste.'
      ], refs: 'João 10:3, 14 · Provérbios 27:23 · Colossenses 4:12' },
      { t: 'Visitar e estar presente', p: [
        'Tiago diz que a religião pura é visitar os órfãos e as viúvas nas suas aflições. A visita é uma das ferramentas mais poderosas do cuidado pastoral: no hospital, no luto, no nascimento de um filho, na mudança, no desemprego, na volta de quem se afastou.',
        'Orientações para visitas: avise antes; vá acompanhado sempre que possível, e nunca sozinho na casa de alguém do sexo oposto; seja breve em hospitais; escute mais do que fale; leia um texto curto e ore; ofereça ajuda prática quando for o caso; e registre a visita no sistema para que a liderança acompanhe.'
      ], refs: 'Tiago 1:27 · Mateus 25:35-40 · Romanos 12:15' },
      { t: 'Ouvir e aconselhar com sabedoria', p: [
        'Tiago ensina a ser pronto para ouvir e tardio para falar. O primeiro passo do aconselhamento é ouvir de verdade, sem interromper, sem julgar e sem pressa de dar respostas. Muitas vezes, a pessoa só precisa ser ouvida e acolhida.',
        'Passos simples: acolha e crie confiança; faça perguntas abertas ("como você está se sentindo com isso?"); ajude a pessoa a ver a situação à luz da Palavra; ore junto; combine um passo prático; e marque um retorno. Evite conselhos apressados, fofoca, exposição e promessas que você não pode cumprir.',
        'Sigilo é indispensável. O que a pessoa conta em confiança não é assunto de grupo de oração nem de conversa com outros líderes, a não ser que haja risco grave, como violência, abuso ou risco de vida, situação em que o pastor deve ser informado imediatamente. Registre no sistema apenas o necessário; assuntos sensíveis ficam nas anotações pastorais restritas.'
      ], refs: 'Tiago 1:19 · Provérbios 18:13; 20:5 · Gálatas 6:1-2 · Provérbios 11:13' },
      { t: 'Saber encaminhar', p: [
        'Nenhum líder sabe tudo nem resolve tudo. Moisés quase se esgotou tentando atender todos os casos sozinho. Saber encaminhar é sinal de maturidade, não de fraqueza.',
        'Encaminhe ao pastor: casos de pecado grave, crises conjugais sérias, decisões importantes, situações de disciplina e assuntos que envolvam a igreja. Encaminhe para profissionais (sempre com conhecimento do pastor): depressão profunda, ideias suicidas, dependência química, transtornos mentais, violência doméstica e abuso. Em situações de risco imediato, oriente a buscar ajuda de emergência e acompanhe de perto. Cuidar também é saber chamar reforços.'
      ], refs: 'Êxodo 18:13-26 · Provérbios 11:14; 15:22' }
    ],
    caso: 'Um jovem da sua célula, que sempre foi animado, parou de ir aos encontros. Quando você manda mensagem, ele responde de forma curta. Um amigo dele conta que ele está muito triste, sem dormir, falando que "seria melhor não existir" e que está bebendo de novo. Discutam: qual é o primeiro passo? Como abordar o jovem? Quem precisa ser informado e quando? Que tipo de ajuda ele precisa além da oração?',
    perguntas: [
      'Quais verbos de Ezequiel 34 você mais pratica? E quais mais negligencia?',
      'Você sabe o nome e a situação de todas as pessoas sob seu cuidado?',
      'O que torna uma visita realmente útil para quem a recebe?',
      'Por que o sigilo é tão importante no cuidado pastoral? Quando ele precisa ser quebrado?',
      'Que casos você deveria encaminhar ao pastor ou a profissionais?'
    ],
    pratica: 'Faça uma lista de todas as pessoas sob seu cuidado e, ao lado de cada nome, escreva como ela está. Entre em contato com todas nesta semana, registre os contatos no sistema e faça pelo menos uma visita (acompanhado). Traga para a próxima aula um aprendizado dessa experiência, sem expor a identidade de ninguém.',
    revisao: [
      'Cite cinco verbos de cuidado presentes em Ezequiel 34.',
      'Quais orientações devem ser seguidas numa visita?',
      'Descreva os passos de um aconselhamento simples.',
      'Em que situações o sigilo deve ser quebrado e o pastor informado?',
      'Cite três situações que precisam de encaminhamento a profissionais.'
    ],
    professor: [
      'Se possível, faça uma simulação de aconselhamento em trios: um aconselha, um é aconselhado e um observa. Depois, troquem os papéis.',
      'Mostre na prática como registrar contatos e anotações no Livres Connect, reforçando o que vai nas anotações pastorais restritas.',
      'Trate o caso com seriedade e informe os contatos de ajuda disponíveis na sua cidade (por exemplo, o CVV pelo telefone 188 e os serviços de saúde mental do município).'
    ]
  },
  /* ------------------------------------------------------------ 6 */
  {
    titulo: 'Fazendo discípulos e formando novos líderes',
    objetivo: 'Entender a multiplicação como estratégia do Reino e aprender a discipular, delegar e preparar sucessores.',
    leitura: 'Mateus 28:18-20 · 2 Timóteo 2:1-7 · Êxodo 18:13-27 · Marcos 3:13-15',
    versiculo: '2 Timóteo 2:2',
    intro: [
      'Paulo escreveu a Timóteo: "O que você ouviu de mim diante de muitas testemunhas, confie a homens fiéis que sejam capazes de ensinar outros". Nessa frase aparecem quatro gerações: Paulo, Timóteo, os homens fiéis e os outros. Esse é o plano de Deus para alcançar o mundo: multiplicação.',
      'Jesus poderia ter alcançado multidões sozinho, mas escolheu investir a maior parte do seu tempo em doze homens. Três anos depois, aqueles discípulos viraram o mundo de cabeça para baixo. O sucesso de um líder não se mede pelo tamanho do grupo que ele reúne, mas pelo número de pessoas que ele forma.',
      'Nesta lição vamos aprender a discipular de forma intencional, delegar com sabedoria e preparar novos líderes, inclusive o nosso sucessor.'
    ],
    secoes: [
      { t: 'A grande comissão é fazer discípulos', p: [
        'Jesus não mandou apenas fazer convertidos, mas discípulos: pessoas que aprendem a obedecer tudo o que ele ordenou. Converter é o começo; discipular é o processo. Uma igreja que só evangeliza e não discipula fica com muitos nascimentos e poucas pessoas maduras.',
        'Na nossa igreja, o caminho de discipulado está organizado na Jornada da Alma: visitante, novo convertido, discipulado, batismo, membro, formação e serviço. Todo líder deve conhecer esse caminho e ajudar as pessoas a darem o próximo passo, usando os estudos para novo convertido, as 8 lições do discipulado e a Escola de Obreiros.'
      ], refs: 'Mateus 28:18-20 · Colossenses 1:28-29 · Efésios 4:11-13' },
      { t: 'O método de Jesus', p: [
        'Jesus chamou os discípulos para estarem com ele: comeram juntos, viajaram juntos, viram seus milagres e suas lágrimas. Discipulado é transmissão de vida, não só de informação. Paulo dizia: "Sejam meus imitadores, como eu sou de Cristo".',
        'Podemos resumir o método em cinco passos: eu faço e você observa; eu faço e você ajuda; você faz e eu ajudo; você faz e eu observo; você faz e eu vou formar outro. Jesus seguiu esse caminho: ensinou e curou; enviou os doze e depois os setenta; ouviu os relatórios, corrigiu e encorajou; e por fim os enviou ao mundo.'
      ], refs: 'Marcos 3:14 · Lucas 9:1-10; 10:1-20 · 1 Coríntios 11:1 · 1 Tessalonicenses 2:7-12' },
      { t: 'O conselho de Jetro: delegar', p: [
        'Moisés atendia o povo da manhã até a noite. Seu sogro Jetro viu e disse: "O que você está fazendo não é bom. Você e o povo vão se esgotar". O conselho foi escolher homens capazes, tementes a Deus, verdadeiros e que odiassem a ganância, e colocá-los como líderes de mil, de cem, de cinquenta e de dez.',
        'Delegar não é se livrar de tarefas, mas compartilhar responsabilidade e autoridade. Boas práticas: escolha pessoas pelo caráter, não só pela habilidade; explique o objetivo, não apenas a tarefa; dê autoridade junto com a responsabilidade; combine prazos e formas de acompanhamento; aceite que o outro fará diferente de você; e celebre o resultado.',
        'Líderes que não delegam costumam ter três motivos: perfeccionismo ("ninguém faz tão bem quanto eu"), insegurança ("posso perder meu lugar") ou falta de tempo para ensinar. Os três precisam ser vencidos para a obra crescer.'
      ], refs: 'Êxodo 18:13-27 · Números 11:16-17 · Atos 6:1-7' },
      { t: 'Identificar e preparar novos líderes', p: [
        'Procure pessoas FIEL: Fiéis (cumprem o que prometem), Interessadas (têm fome de crescer), Ensináveis (aceitam correção), Leais (honram a liderança) e com amor pelas pessoas. Não procure apenas os mais talentosos ou extrovertidos; muitas vezes Deus levanta líderes improváveis.',
        'Dê oportunidades progressivas: dirigir a oração, conduzir um momento na célula, acompanhar visitas, ministrar uma palavra curta, liderar quando você estiver ausente. Dê retorno sincero e encorajador depois de cada oportunidade. Indique o futuro líder para a Escola de Obreiros.'
      ], refs: '2 Timóteo 2:2 · Atos 16:1-3 · 1 Timóteo 4:12-16' },
      { t: 'Preparar o sucessor e multiplicar', p: [
        'Moisés preparou Josué; Elias preparou Eliseu; Paulo preparou Timóteo. Um líder maduro trabalha para que a obra continue sem ele. Em toda célula e ministério deve haver um auxiliar sendo preparado para assumir ou para iniciar um novo grupo.',
        'Multiplicar uma célula ou ministério pode doer, porque relações bonitas se dividem. Mas é assim que o Reino cresce: a semente que morre produz muito fruto. Celebre a multiplicação como uma vitória, não como uma perda.'
      ], refs: 'Deuteronômio 31:7-8; 34:9 · 2 Reis 2:1-15 · João 12:24 · Atos 13:1-3' }
    ],
    caso: 'Uma célula começou com oito pessoas e hoje tem vinte e cinco. O líder, Carlos, faz tudo sozinho: conduz, ministra, visita e organiza. Ele diz que ainda ninguém está pronto para ajudar e que tem medo de dividir o grupo e "perder o mover de Deus". Os encontros estão lotados, e alguns membros novos dizem que não conseguem conversar com ninguém. Discutam: quais os riscos dessa situação? Como Carlos pode identificar e preparar auxiliares? Que plano de multiplicação vocês sugerem?',
    perguntas: [
      'Qual a diferença entre fazer convertidos e fazer discípulos?',
      'Quais dos cinco passos do método de Jesus você já pratica?',
      'Qual dos três motivos para não delegar mais aparece em você?',
      'Quem são as pessoas FIEL ao seu redor hoje?',
      'Você já tem um sucessor sendo preparado? Se não, quem poderia ser?'
    ],
    pratica: 'Escolha uma ou duas pessoas para investir intencionalmente nos próximos meses. Nesta semana, convide uma delas para fazer algo junto com você no ministério, seguindo o método "eu faço, você ajuda". Se ainda não discipula ninguém, converse com a liderança para assumir um discipulado (8 lições) no sistema.',
    revisao: [
      'Quais são as quatro gerações de 2 Timóteo 2:2?',
      'Descreva os cinco passos do método de Jesus.',
      'Quais foram as qualidades exigidas por Jetro para os novos líderes?',
      'O que significa a sigla FIEL?',
      'Por que a multiplicação é estratégica para o Reino?'
    ],
    professor: [
      'Faça um exercício: cada aluno desenha a sua "árvore de discipulado", com quem o discipulou e quem ele está discipulando.',
      'Mostre no Livres Connect como iniciar um discipulado e acompanhar as 8 lições.',
      'Incentive cada aluno a sair da aula com o nome de pelo menos uma pessoa para discipular.'
    ]
  },
  /* ------------------------------------------------------------ 7 */
  {
    titulo: 'Trabalho em equipe, comunicação e conflitos',
    objetivo: 'Aprender a trabalhar em equipe, comunicar-se com clareza e tratar conflitos de forma bíblica, preservando a unidade.',
    leitura: 'Eclesiastes 4:9-12 · Atos 15:1-35 · Mateus 18:15-17 · Efésios 4:1-6, 25-32',
    versiculo: 'Efésios 4:3',
    intro: [
      'Nenhum líder bíblico fez a obra sozinho. Moisés tinha Arão, Hur e Josué; Neemias reconstruiu os muros com famílias inteiras trabalhando lado a lado; Jesus enviou os discípulos de dois em dois; Paulo sempre viajava com uma equipe.',
      'Onde há pessoas trabalhando juntas, há diferenças de opinião, temperamentos e expectativas. Conflitos não são sinal de que algo está errado; a forma como os tratamos é que revela a maturidade de uma equipe.',
      'Nesta lição vamos aprender princípios de trabalho em equipe, comunicação saudável e resolução de conflitos, tendo como base o ensino de Jesus e o exemplo da igreja primitiva.'
    ],
    secoes: [
      { t: 'Melhor dois do que um', p: [
        'Eclesiastes diz que dois são melhores do que um, porque, se um cair, o outro o levanta; e que o cordão de três dobras não se rompe com facilidade. Equipe traz força, proteção, complementaridade e alegria.',
        'Em uma boa equipe, cada pessoa conhece seu papel, os objetivos são claros, há confiança mútua, as reuniões são produtivas e as vitórias são celebradas juntas. O líder não precisa ser o melhor em tudo; precisa ajudar cada um a dar o seu melhor.',
        'Diferenças de temperamento são uma riqueza. Pedro era impulsivo, João contemplativo, Tomé questionador, Mateus organizado. Jesus formou uma equipe com eles. Aprenda a valorizar quem pensa diferente de você.'
      ], refs: 'Eclesiastes 4:9-12 · Neemias 3-4 · 1 Coríntios 3:5-9; 12:14-26' },
      { t: 'Comunicação que constrói', p: [
        'Muitos conflitos nascem de falhas de comunicação: informação que não chegou, combinado que não ficou claro, tom de voz inadequado, mensagem mal interpretada no WhatsApp.',
        'Boas práticas: avise com antecedência e por escrito o que é importante (data, horário, local, responsáveis); confirme se a pessoa entendeu; prefira conversar pessoalmente ou por ligação em assuntos delicados; não trate problemas pessoais em grupos; use palavras que edificam; e lembre que o tom importa tanto quanto o conteúdo.',
        'Paulo orienta a falar a verdade em amor. Verdade sem amor fere; amor sem verdade engana. O líder maduro diz o que precisa ser dito, do jeito certo e na hora certa.'
      ], refs: 'Efésios 4:15, 25, 29 · Provérbios 15:1, 23; 25:11 · Colossenses 4:6' },
      { t: 'O caminho de Jesus para resolver conflitos', p: [
        'Jesus deixou um passo a passo em Mateus 18: primeiro, vá e converse a sós com a pessoa; se ela ouvir, você ganhou seu irmão. Se não ouvir, leve mais uma ou duas pessoas maduras. Se ainda assim não houver solução, leve à liderança da igreja.',
        'O que Jesus não mandou fazer: comentar com outros, postar indiretas nas redes, formar grupos, guardar mágoa em silêncio ou sair da igreja sem conversar. A fofoca transforma um problema entre duas pessoas em uma ferida na comunidade inteira.',
        'Antes da conversa, ore, examine o próprio coração (tire a trave do seu olho), procure entender o lado do outro e vá com o objetivo de reconciliar, não de vencer.'
      ], refs: 'Mateus 18:15-17 · Mateus 5:23-24; 7:3-5 · Provérbios 16:28; 17:9' },
      { t: 'Atos 15: decisões em equipe', p: [
        'A igreja primitiva enfrentou uma grande divergência: os gentios convertidos precisavam seguir a lei de Moisés? Em vez de dividir a igreja, os apóstolos e presbíteros se reuniram, ouviram os relatos, debateram com franqueza, consultaram as Escrituras e buscaram a direção do Espírito. A decisão foi comunicada com clareza e cuidado: "pareceu bem ao Espírito Santo e a nós".',
        'Lições para as nossas equipes: divergências podem ser tratadas com respeito; todos devem ser ouvidos; a Palavra é a referência; a decisão final cabe à liderança constituída; e, uma vez decidida, a equipe deve se unir em torno da decisão, mesmo quem pensava diferente.',
        'O mesmo capítulo mostra que até líderes maduros discordam: Paulo e Barnabé se separaram por causa de João Marcos. Mais tarde, porém, Paulo reconheceu o valor de Marcos. Conflitos podem ser superados com o tempo e com humildade.'
      ], refs: 'Atos 15:1-35 · Atos 15:36-41 · 2 Timóteo 4:11' },
      { t: 'Preservar a unidade', p: [
        'Paulo pede que nos esforcemos para preservar a unidade do Espírito pelo vínculo da paz. A unidade não é uniformidade, mas comunhão em torno de Jesus e da missão. Ela exige humildade, mansidão, paciência e o hábito de suportar uns aos outros em amor.',
        'O líder é guardião da unidade: não alimenta divisões, não toma partido em fofocas, corrige com amor quem semeia contenda e é o primeiro a pedir perdão quando erra. Onde há unidade, Deus ordena a bênção.'
      ], refs: 'Efésios 4:1-6 · Salmos 133 · João 17:20-23 · Romanos 16:17-18 · Tito 3:10' }
    ],
    caso: 'O ministério de louvor e o ministério de mídia vivem em atrito. O louvor reclama que o som está sempre ruim; a mídia reclama que o louvor muda o repertório em cima da hora e não manda as letras. No último domingo, houve uma discussão na frente dos irmãos e mensagens duras no grupo de WhatsApp. Agora alguns voluntários da mídia querem sair. Discutam: como aplicar Mateus 18 e Atos 15 nessa situação? Que combinados práticos poderiam evitar novos conflitos?',
    perguntas: [
      'Que benefícios você já experimentou ao trabalhar em equipe?',
      'Quais falhas de comunicação mais geram problemas no seu ministério?',
      'Por que é tão difícil conversar diretamente com quem nos magoou?',
      'O que Atos 15 ensina sobre tomar decisões quando há divergência?',
      'Como o líder pode proteger a unidade da equipe?'
    ],
    pratica: 'Se houver algum conflito pendente na sua vida ou no seu ministério, dê o primeiro passo de Mateus 18 nesta semana, com oração e humildade. Faça também uma reunião curta com sua equipe para alinhar responsabilidades, prazos e a forma de se comunicar (por exemplo, o que vai para o grupo e o que se trata pessoalmente).',
    revisao: [
      'Cite três benefícios do trabalho em equipe segundo Eclesiastes 4.',
      'Cite quatro boas práticas de comunicação para líderes.',
      'Descreva os passos de Mateus 18:15-17.',
      'Que princípios de decisão em equipe aparecem em Atos 15?',
      'Qual a diferença entre unidade e uniformidade?'
    ],
    professor: [
      'Faça uma dramatização do caso louvor x mídia com voluntários e depois mostre como seria a conversa conduzida segundo Mateus 18.',
      'Aproveite para combinar com a turma regras simples de comunicação para os grupos de WhatsApp dos ministérios.',
      'Termine com um momento de reconciliação: dê espaço para quem quiser pedir perdão ou orar por alguém.'
    ]
  },
  /* ------------------------------------------------------------ 8 */
  {
    titulo: 'Integridade e proteção do líder: família, finanças e cuidado consigo',
    objetivo: 'Identificar as áreas de maior risco na vida do líder e estabelecer proteções práticas para terminar bem a carreira.',
    leitura: '1 Coríntios 9:24-27; 10:12-13 · 2 Samuel 11:1-27 · 1 Timóteo 4:16; 6:6-11 · Atos 20:28',
    versiculo: '1 Timóteo 4:16',
    intro: [
      'Davi foi chamado de homem segundo o coração de Deus. Mesmo assim, num tempo em que deveria estar na guerra, ficou em casa, viu Bate-Seba, cometeu adultério e mandou matar o marido dela. Um momento de descuido trouxe consequências para a família e o reino por muitos anos.',
      'Paulo escreveu: "Aquele que pensa estar em pé, cuide para que não caia". Nenhum líder está imune. Por isso, mais importante do que começar bem é terminar bem. Paulo, no fim da vida, pôde dizer: "Combati o bom combate, terminei a corrida, guardei a fé".',
      'Nesta última lição vamos tratar das áreas em que líderes mais caem, como sexualidade, dinheiro, orgulho, família e esgotamento, e das proteções que nos ajudam a permanecer firmes.'
    ],
    secoes: [
      { t: 'Cuide de si mesmo primeiro', p: [
        'Paulo disse a Timóteo: "Cuide de você mesmo e da doutrina". E aos presbíteros de Éfeso: "Cuidem de vocês mesmos e de todo o rebanho". A ordem não é egoísta: um líder que não cuida da própria alma não terá forças para cuidar de ninguém.',
        'Cuidar de si inclui a vida com Deus (lição 3), a saúde física (sono, alimentação, exercício), a saúde emocional (descanso, lazer, amizades, ajuda profissional quando necessário) e os limites da agenda. Jesus convidou os discípulos cansados: "Venham comigo para um lugar deserto e descansem um pouco".'
      ], refs: '1 Timóteo 4:16 · Atos 20:28 · Marcos 6:30-32 · 3 João 2' },
      { t: 'Pureza sexual e cuidados práticos', p: [
        'A queda de Davi começou com um olhar que não foi desviado. A tentação sexual raramente começa com um ato; começa com pensamentos, conversas, mensagens e situações que vão se aproximando do limite. José, ao contrário, fugiu da mulher de Potifar.',
        'Proteções práticas: não aconselhar nem visitar a sós pessoas do sexo oposto; manter conversas de aconselhamento em locais visíveis; evitar mensagens íntimas ou fora de hora; ter filtros e prestação de contas no uso da internet; cultivar o casamento (para os casados) com tempo, carinho e diálogo; e confessar cedo as lutas a alguém de confiança. Cuidado redobrado com pessoas emocionalmente fragilizadas que buscam aconselhamento.',
        'Proteção de crianças e adolescentes: nunca fique a sós com um menor de idade; mantenha sempre dois adultos nas atividades do ministério infantil; respeite os pais e as regras da igreja; e comunique imediatamente à liderança qualquer suspeita de abuso, sem tentar resolver sozinho.'
      ], refs: '2 Samuel 11:1-4 · Gênesis 39:6-12 · Provérbios 4:23-27; 5:1-23 · Jó 31:1 · 1 Tessalonicenses 4:3-8' },
      { t: 'Dinheiro: transparência e contentamento', p: [
        'O amor ao dinheiro é raiz de muitos males. Judas, que cuidava da bolsa, roubava. Geazi mentiu para obter vantagem. Ananias e Safira fingiram uma generosidade que não tinham. Dinheiro mal administrado destrói o testemunho de líderes e de igrejas.',
        'Proteções práticas: nunca manusear sozinho dinheiro da igreja (contagem sempre com duas pessoas e registro no sistema financeiro); guardar comprovantes; não misturar recursos da igreja com recursos pessoais; não usar a posição para pedir empréstimos ou vantagens; não ter dívidas descontroladas; e ser fiel nos dízimos e ofertas. Paulo cuidava para fazer o que é correto não apenas diante de Deus, mas também diante dos homens.'
      ], refs: '1 Timóteo 6:6-11 · João 12:6 · 2 Reis 5:20-27 · Atos 5:1-11 · 2 Coríntios 8:20-21' },
      { t: 'Família: o primeiro ministério', p: [
        'Paulo pergunta: se alguém não sabe governar a própria casa, como cuidará da igreja de Deus? O ministério não pode servir de desculpa para abandonar o cônjuge e os filhos. Muitos filhos de líderes se afastaram de Deus porque sentiram que a igreja era mais importante do que eles.',
        'Proteja tempos de família na agenda: refeições juntos, um dia de descanso, um momento semanal com o cônjuge, atenção às atividades dos filhos e culto doméstico simples. Envolva a família no ministério com alegria, mas sem pressão e sem expô-la. Lembre-se de que a família do líder também precisa de pastoreio.'
      ], refs: '1 Timóteo 3:4-5; 5:8 · Efésios 5:25-6:4 · Josué 24:15 · 1 Samuel 2:12-17, 22-25; 3:13' },
      { t: 'Orgulho, esgotamento e prestação de contas', p: [
        'O orgulho precede a queda. Uzias tornou-se poderoso, o coração dele se exaltou e ele caiu. O sucesso no ministério pode alimentar a vaidade, a comparação e a sensação de que estamos acima das regras. O antídoto é a humildade, a gratidão e a lembrança de que tudo é graça.',
        'O esgotamento também é um perigo real: líderes que nunca descansam, carregam tudo sozinhos e não pedem ajuda acabam doentes, amargos ou vulneráveis ao pecado. Elias chegou a pedir a morte. Deus cuidou dele com sono, comida, presença e uma nova equipe.',
        'A maior proteção é a prestação de contas: ter pessoas a quem você permite fazer perguntas difíceis sobre sua vida com Deus, sua família, seu dinheiro, sua pureza e sua agenda. Líderes que caem geralmente estavam sozinhos. Ninguém termina bem a corrida isolado.'
      ], refs: 'Provérbios 16:18 · 2 Crônicas 26:16 · 1 Reis 19:1-18 · Tiago 5:16 · Hebreus 3:13 · 2 Timóteo 4:6-8' }
    ],
    caso: 'Um líder respeitado da igreja começou a aconselhar sozinho uma irmã que estava passando por um divórcio. As conversas, que eram na igreja, passaram a ser por mensagens à noite. Ele percebeu que estava esperando ansioso por essas conversas e começou a esconder o celular da esposa. Ainda não aconteceu nada físico, mas ele sabe que algo está errado. Discutam: em que momento ele cruzou os limites? O que ele deve fazer agora? Que proteções teriam evitado essa situação? Como a igreja deve acolher alguém que confessa uma luta assim?',
    perguntas: [
      'Qual das áreas desta lição representa maior risco para você hoje?',
      'Que proteções práticas você já tem? Quais precisa criar?',
      'Como está a sua família em relação ao seu ministério?',
      'Você tem alguém a quem presta contas de verdade? Quem?',
      'O que significa, para você, "terminar bem"?'
    ],
    pratica: 'Escreva seu "pacto de integridade": as proteções que você vai adotar em sexualidade, dinheiro, família, agenda e prestação de contas. Converse sobre ele com seu cônjuge (se for casado) e com seu líder ou discipulador. Marque um encontro mensal de prestação de contas com uma pessoa madura do mesmo sexo.',
    revisao: [
      'Por que Paulo manda o líder cuidar primeiro de si mesmo?',
      'Cite quatro proteções práticas na área da pureza sexual.',
      'Cite três cuidados na proteção de crianças e adolescentes.',
      'Cite quatro proteções práticas na área financeira.',
      'O que é prestação de contas e por que ela protege o líder?'
    ],
    professor: [
      'Trate os temas com seriedade e sem sensacionalismo; não exponha casos reais de pessoas conhecidas.',
      'Encerre o curso com um culto de consagração: oração pelos alunos, unção com óleo, compromisso com o pacto de integridade e entrega dos certificados aos aprovados.',
      'Lembre a turma de que a formação continua: os líderes devem participar das reuniões de liderança e seguir em discipulado.'
    ]
  }
];
