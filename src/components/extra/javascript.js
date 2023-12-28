document.addEventListener('DOMContentLoaded', function () {
    var socket = io();

    socket.on('request', data => {
        console.log(data);
    });

    const emitWithComment = (action, spData) => {
        console.log('DataSent', { action, spData });
        socket.emit('request', { action, spData });
    };

    const SP = () => {
        var spData = {};
        spData['name'] = $('#Rname').val();
        spData['email'] = $('#Remail').val();
        spData['password'] = $('#passwordsas').val();
        emitWithComment('registration', spData);
    };

    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        registerButton.addEventListener('click', SP);
    }

    const SIF = () => {
        var spData = {};
        spData['username'] = $('#username-sign').val();
        spData['password'] = $('#password-sign').val();
        emitWithComment('Signin', spData);
    };
    const signInButton = document.getElementById('signInButton');
    if (signInButton) {
        signInButton.addEventListener('click', SIF);
    }

    const SWG = () => {
        window.location.href = '/auth';
        socket.emit('request', { action: 'SignIn-Google' });
    };

    const SignInGoogle = document.getElementById('SignInGoogle');
    if (SignInGoogle) {
        SignInGoogle.addEventListener('click', SWG);
    }

    const SWF = () => {
        window.location.href = '/login/oauth2/code/facebook';
        // socket.emit('request', { action: 'SignIn-Facebook' });
    };

    const SignInFacebook = document.getElementById('SignInFacebook');
    if (SignInFacebook) {
        SignInFacebook.addEventListener('click', SWF);
    }

    function sendChatmessage() {
        var spData = {};
        spData['playerid'] = $('#userId').val();
        spData['receiverPlayerid'] = $('#receiver').val();
        spData['message'] = $('#chatmessage').val();
        emitWithComment('chat-message', spData);
    }

    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.addEventListener('click', sendChatmessage);
    }

    function sendChat() {
        var spData = {};
        spData['message'] = $('#chatmessageprivate').val();
        spData['playerid'] = $('#privateid').val();
        spData['roomid'] = $('#roomprivateid').val();
        emitWithComment('chat-message-private', spData);
    }
    const chatmessageprivate = document.getElementById('chatmessageprivate');
    if (chatmessageprivate) {
        chatmessageprivate.addEventListener('click', sendChat);
    }

    function globalmessage() {
        var spData = {};
        spData['message'] = $('#gmessage').val();
        spData['playerid'] = $('#gid').val();
        emitWithComment('create-room-chat', spData);
    }
    const createroomchat = document.getElementById('createroomchat');
    if (createroomchat) {
        createroomchat.addEventListener('click', globalmessage);
    }

    const CMHD = () => {
        var spData = {};
        spData['playerid'] = $('#senderid').val();
        spData['receiverPlayerid'] = $('#receiverid').val();
        emitWithComment('chat-message-history', spData);
    };

    const chatmessagehistory = document.getElementById('chatmessagehistory');
    if (chatmessagehistory) {
        chatmessagehistory.addEventListener('click', CMHD);
    }

    const FR = () => {
        var spData = {};
        spData['token'] = $('#Femail').val();
        spData['fromemail'] = $('#from').val();
        emitWithComment('Friend-Request', spData);
    };

    const FriendRequest = document.getElementById('FriendRequest');
    if (FriendRequest) {
        FriendRequest.addEventListener('click', FR);
    }

    document.getElementById('image-sends').addEventListener('submit', e => {
        e.preventDefault();
        const fileInput = document.getElementById('Eimage');
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const imageUser = document.getElementById('Eimage').value;
        const imageUsers = document.getElementById('crtoken').value;
        const imageUseres = document.getElementById('froms').value;
        const Subjectsm = document.getElementById('Subjects').value;
        const messages = document.getElementById('message').value;
        formData.append('imageUser', imageUser);
        formData.append('token', imageUsers);
        formData.append('froms', imageUseres);
        formData.append('Subjects', Subjectsm);
        formData.append('message', messages);

        fetch('/emailupload', {
            method: 'POST',
            body: formData,
        })
            .then(data => {
                data.imageuser;
                data.imageUsers;
                data.imageUseres;
                data.Subjects;
                data.message;
                data.imageUrl;
                console.log(data);
                socket.emit('Create-mail', { action: 'Create-mail', imageUrl: data });
            })
            .catch(error => {
                console.log('Error uploading image:', error);
            });
    });

    const EDD = () => {
        var spData = {};
        spData['token'] = $('#emaildeletetoken').val();
        spData['id'] = $('#edeleteid').val();
        emitWithComment('Email-Delete', spData);
    };

    const EmailDelete = document.getElementById('EmailDelete');
    if (EmailDelete) {
        EmailDelete.addEventListener('click', EDD);
    }

    const EI = () => {
        var spData = {};
        spData['token'] = $('#yourmailss').val();
        emitWithComment('Inbox', spData);
    };
    const Inbox = document.getElementById('Inbox');
    if (Inbox) {
        Inbox.addEventListener('click', EI);
    }

    const ESI = () => {
        var spData = {};
        spData['token'] = $('#emailsend').val();
        emitWithComment('send-Inbox', spData);
    };
    const sendInbox = document.getElementById('sendInbox');
    if (sendInbox) {
        sendInbox.addEventListener('click', ESI);
    }
    const MB = () => {
        emitWithComment('Mini-Bundle');
    };

    const MiniBundle = document.getElementById('MiniBundle');
    if (MiniBundle) {
        MiniBundle.addEventListener('click', MB);
    }

    const BB = () => {
        emitWithComment('Big-Bundle');
    };

    const BigBundle = document.getElementById('BigBundle');
    if (BigBundle) {
        BigBundle.addEventListener('click', BB);
    }

    const OP = () => {
        emitWithComment('payment');
    };

    const payment = document.getElementById('payment');
    if (payment) {
        payment.addEventListener('click', OP);
    }

    const FBT = () => {
        emitWithComment('complete-Task');
    };

    const completeTask = document.getElementById('completeTask');
    if (completeTask) {
        completeTask.addEventListener('click', FBT);
    }

    const WC = () => {
        var spData = {};
        spData['token'] = $('#wctoken').val();
        emitWithComment('Watch-Collect', spData);
    };

    const WatchCollect = document.getElementById('WatchCollect');
    if (WatchCollect) {
        WatchCollect.addEventListener('click', WC);
    }

    const ST = () => {
        var spData = {};
        spData['item'] = $('#Search-item').val();
        emitWithComment('Search-Bar', spData);
    };

    const SearchBar = document.getElementById('SearchBar');
    if (SearchBar) {
        SearchBar.addEventListener('click', ST);
    }

    const SI = () => {
        emitWithComment('Store-Item');
    };

    const StoreItem = document.getElementById('StoreItem');
    if (StoreItem) {
        StoreItem.addEventListener('click', SI);
    }

    const CF = () => {
        var spData = {};
        spData['token'] = $('#Chtoken').val();
        spData['id'] = $('#ChallengeUser').val();
        emitWithComment('Challenge-Friends', spData);
    };

    const ChallengeFriends = document.getElementById('ChallengeFriends');
    if (ChallengeFriends) {
        ChallengeFriends.addEventListener('click', CF);
    }

    const VAC = () => {
        var spData = {};
        spData['token'] = $('#vctoken').val();
        emitWithComment('view-Challenge', spData);
    };

    const viewChallenge = document.getElementById('viewChallenge');
    if (viewChallenge) {
        viewChallenge.addEventListener('click', VAC);
    }

    const PJBFD = () => {
        var spData = {};
        spData['token'] = $('#joinbytoken').val();
        spData['key'] = $('#joinby').val();
        emitWithComment('player-join-friends', spData);
    };

    const playerjoinfriends = document.getElementById('playerjoinfriends');
    if (playerjoinfriends) {
        playerjoinfriends.addEventListener('click', PJBFD);
    }

    const SF = () => {
        var spData = {};
        spData['token'] = $('#SToken').val();
        spData['names'] = $('#usernamees').val();
        emitWithComment('SFriend', spData);
    };

    const SFriend = document.getElementById('SFriend');
    if (SFriend) {
        SFriend.addEventListener('click', SF);
    }

    const ATFD = () => {
        var spData = {};
        spData['token'] = $('#addedtoken').val();
        spData['key'] = $('#addedkey').val();
        spData['pendingId'] = $('#prndingid').val();
        emitWithComment('added-to-friend', spData);
    };

    const addedtofriend = document.getElementById('addedtofriend');
    if (addedtofriend) {
        addedtofriend.addEventListener('click', ATFD);
    }

    const AF = () => {
        var spData = {};
        spData['token'] = $('#userst').val();
        spData['id'] = $('#ADFriend').val();
        emitWithComment('AFriend', spData);
    };

    const AFriend = document.getElementById('AFriend');
    if (AFriend) {
        AFriend.addEventListener('click', AF);
    }

    const VNA = () => {
        var spData = {};
        spData['token'] = $('#notitoken').val();
        emitWithComment('View-notification', spData);
    };

    const Viewnotification = document.getElementById('Viewnotification');
    if (Viewnotification) {
        Viewnotification.addEventListener('click', VNA);
    }

    const RF = () => {
        var spData = {};
        spData['token'] = $('#rmtoken').val();
        spData['id'] = $('#remov-fr').val();
        emitWithComment('remove-friend', spData);
    };

    const removefriend = document.getElementById('removefriend');
    if (removefriend) {
        removefriend.addEventListener('click', RF);
    }

    const VAF = () => {
        var spData = {};
        spData['token'] = $('#vftoken').val();
        emitWithComment('View-Friend', spData);
    };

    const ViewFriend = document.getElementById('ViewFriend');
    if (ViewFriend) {
        ViewFriend.addEventListener('click', VAF);
    }

    document.getElementById('image-send').addEventListener('submit', e => {
        e.preventDefault();
        const fileInput = document.getElementById('upimage');
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const token = document.getElementById('imageUser').value;
        formData.append('token', token);

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
            .then(data => {
                data.token;
                data.imageUrl;
                socket.emit('Profile-Picture', { action: 'Profile-Picture', imageUrl: data });
            })
            .catch(error => {
                console.error('Error uploading image:', error);
            });
    });

    const CU = () => {
        var spData = {};
        spData['token'] = $('#Old-name').val();
        spData['newname'] = $('#Changename').val();
        emitWithComment('Change-Username', spData);
    };

    const ChangeUsername = document.getElementById('ChangeUsername');
    if (ChangeUsername) {
        ChangeUsername.addEventListener('click', CU);
    }

    const CE = () => {
        var spData = {};
        spData['token'] = $('#Old-email').val();
        spData['newemail'] = $('#New-email').val();
        emitWithComment('Change-Email', spData);
    };

    const ChangeEmail = document.getElementById('ChangeEmail');
    if (ChangeEmail) {
        ChangeEmail.addEventListener('click', CE);
    }

    const DA = () => {
        var spData = {};
        spData['token'] = $('#tokenInput').val();
        spData['otp'] = $('#otpInput').val();
        emitWithComment('Delete-Account', spData);
    };

    const DeleteAccount = document.getElementById('DeleteAccount');
    if (DeleteAccount) {
        DeleteAccount.addEventListener('click', DA);
    }

    const EC = () => {
        var spData = {};
        spData['token'] = $('#emailtoken').val();
        emitWithComment('Email-Code', spData);
    };

    const EmailCode = document.getElementById('EmailCode');
    if (EmailCode) {
        EmailCode.addEventListener('click', EC);
    }

    const RA = () => {
        var spData = {};
        spData['token'] = $('#tokenu').val();
        spData['otp'] = $('#passwordsa').val();
        emitWithComment('Recover-Account', spData);
    };

    const RecoverAccount = document.getElementById('RecoverAccount');
    if (RecoverAccount) {
        RecoverAccount.addEventListener('click', RA);
    }

    const UP = () => {
        var spData = {};
        spData['token'] = $('#UToken').val();
        emitWithComment('User-Profile', spData);
    };

    const UserProfile = document.getElementById('UserProfile');
    if (UserProfile) {
        UserProfile.addEventListener('click', UP);
    }

    const SO = () => {
        var spData = {};
        spData['token'] = $('#Signemail').val();
        emitWithComment('Sign-Out', spData);
    };

    const SignOut = document.getElementById('SignOut');
    if (SignOut) {
        SignOut.addEventListener('click', SO);
    }

    const FG = () => {
        var spData = {};
        spData['token'] = $('#UserGraphics').val();
        spData['Graphics'] = $('#Graphics').val();
        spData['Shadows'] = $("input[name='Shadows']:checked").val();
        spData['Effects'] = $("input[name='Effects']:checked").val();
        emitWithComment('Graphics', spData);
    };

    const Graphics = document.getElementById('Graphics');
    if (Graphics) {
        Graphics.addEventListener('click', FG);
    }

    const AV = () => {
        var spData = {};
        spData['token'] = $('#AudioEmail').val();
        spData['Volume'] = $('#Volume').val();
        spData['SFX'] = $("input[name='SFX']:checked").val();
        spData['AppSFX'] = $("input[name='AppSFX']:checked").val();
        emitWithComment('Audio', spData);
    };

    const Audio = document.getElementById('Audio');
    if (Audio) {
        Audio.addEventListener('click', AV);
    }

    const Fe = () => {
        var spData = {};
        spData['token'] = $('#feedtoken').val();
        spData['message'] = $('#feedmessage').val();
        emitWithComment('feedback', spData);
    };

    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.addEventListener('click', Fe);
    }

    document.getElementById('Storeimage-send').addEventListener('submit', e => {
        e.preventDefault();
        const fileInput = document.getElementById('stoimage');
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const images = document.getElementById('SItem').value;
        formData.append('Item', images);
        const Type = document.getElementById('Type').value;
        formData.append('Type', Type);
        const Price = document.getElementById('Price').value;
        formData.append('Price', Price);
        const IOS = document.getElementById('ios').value;
        formData.append('ios', IOS);
        const Android = document.getElementById('Android').value;
        formData.append('Android', Android);

        console.log({ action: 'Add-To-Store', data: { image: fileInput.files[0], type: Type, price: Price, ios: IOS, android: Android } });

        fetch('/store', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                socket.emit('Add-To-Store', { action: 'Add-To-Store', data: data });
            })
            .catch(error => {
                console.error('Error uploading image:', error);
            });
    });

    const SRI = () => {
        var spData = {};
        spData['id'] = $('#itemid').val();
        // spData["item"] = $("#SItems").val();
        // spData["Type"] = $("#Types").val();
        emitWithComment('Remove-To-Store', spData);
    };

    const RemoveToStore = document.getElementById('RemoveToStore');
    if (RemoveToStore) {
        RemoveToStore.addEventListener('click', SRI);
    }

    const GDC = () => {
        var spData = {};
        spData['token'] = $('#DiceId').val();
        emitWithComment('Dice-Daily', spData);
    };

    const DiceDaily = document.getElementById('DiceDaily');
    if (DiceDaily) {
        DiceDaily.addEventListener('click', GDC);
    }

    const GDW = () => {
        var spData = {};
        spData['token'] = $('#DiceIds').val();
        emitWithComment('Dice-Weekly', spData);
    };

    const DiceWeekly = document.getElementById('DiceWeekly');
    if (DiceWeekly) {
        DiceWeekly.addEventListener('click', GDW);
    }

    const GDCC = () => {
        var spData = {};
        spData['token'] = $('#CCId').val();
        emitWithComment('Dice-Challenges', spData);
    };

    const DiceChallenges = document.getElementById('DiceChallenges');
    if (DiceChallenges) {
        DiceChallenges.addEventListener('click', GDCC);
    }

    const DB = () => {
        var spData = {};
        spData['token'] = $('#Dtoken').val();
        emitWithComment('Daily-Bonus', spData);
    };

    const DailyBonus = document.getElementById('DailyBonus');
    if (DailyBonus) {
        DailyBonus.addEventListener('click', DB);
    }

    const GC = () => {
        var spData = {};
        spData['token'] = $('#gctoken').val();
        spData['coin'] = $('#coincash').val();
        emitWithComment('Gold-cash', spData);
    };

    const Goldcash = document.getElementById('Goldcash');
    if (Goldcash) {
        Goldcash.addEventListener('click', GC);
    }

    const ADC = () => {
        var spData = {};
        spData['name'] = $('#chllangename').val();
        spData['coin'] = $('#Dailychcoin').val();
        emitWithComment('add-Daily-challenges', spData);
    };

    const addDailychallenges = document.getElementById('addDailychallenges');
    if (addDailychallenges) {
        addDailychallenges.addEventListener('click', ADC);
    }

    const VACD = () => {
        emitWithComment('view-all-Challenges');
    };

    const viewallChallenges = document.getElementById('viewallChallenges');
    if (viewallChallenges) {
        viewallChallenges.addEventListener('click', VACD);
    }

    const CDCD = () => {
        var spData = {};
        spData['token'] = $('#completetoken').val();
        spData['challengeId'] = $('#challengeId').val();
        spData['points'] = $('#completepoint').val();
        emitWithComment('complete-Daily-Challenge', spData);
    };

    const completeDailyChallenge = document.getElementById('completeDailyChallenge');
    if (completeDailyChallenge) {
        completeDailyChallenge.addEventListener('click', CDCD);
    }

    const VDCD = () => {
        var spData = {};
        spData['token'] = $('#viewchtoken').val();
        emitWithComment('View-Daily-Challenge', spData);
    };

    const ViewDailyChallenge = document.getElementById('ViewDailyChallenge');
    if (ViewDailyChallenge) {
        ViewDailyChallenge.addEventListener('click', VDCD);
    }

    // const CCGD = () => {
    //     var spData = {};
    //     spData["token"] = $("#gifttoken").val();
    //     emitWithComment("chellange-complite-gift", spData);
    // }

    const CGR = () => {
        var spData = {};
        spData['playerid'] = $('#playergmaeid').val();
        socket.emit('request', { action: 'Create-Game-Room', spData });
    };

    const CreateGameRoom = document.getElementById('CreateGameRoom');
    if (CreateGameRoom) {
        CreateGameRoom.addEventListener('click', CGR);
    }

    const PRCD = () => {
        var spData = {};
        spData['playerid'] = $('#privateroomid').val();
        spData['room'] = $('#privateroom').val();
        socket.emit('request', { action: 'Priveate-room-create', spData });
    };

    const Priveateroomcreate = document.getElementById('Priveateroomcreate');
    if (Priveateroomcreate) {
        Priveateroomcreate.addEventListener('click', PRCD);
    }

    const JGR = () => {
        var spData = {};
        spData['playerid'] = $('#joinroomid').val();
        spData['roomid'] = $('#roomid').val();
        socket.emit('request', { action: 'Join-Game-Room', spData });
    };

    const JoinGameRoom = document.getElementById('JoinGameRoom');
    if (JoinGameRoom) {
        JoinGameRoom.addEventListener('click', JGR);
    }

    const LGGR = () => {
        var spData = {};
        spData['playerid'] = $('#gplayerleaveid').val();
        spData['roomid'] = $('#gleaveroomids').val();
        socket.emit('request', { action: 'Leave-global-Room', spData });
    };

    const LeaveglobalRoom = document.getElementById('LeaveglobalRoom');
    if (LeaveglobalRoom) {
        LeaveglobalRoom.addEventListener('click', LGGR);
    }

    const LGR = () => {
        var spData = {};
        spData['playerid'] = $('#playerleaveid').val();
        spData['roomid'] = $('#leaveroomids').val();
        socket.emit('request', { action: 'Leave-Game-Room', spData });
    };

    const LeaveGameRoom = document.getElementById('LeaveGameRoom');
    if (LeaveGameRoom) {
        LeaveGameRoom.addEventListener('click', LGR);
    }

    const GCA = () => {
        var spData = {};
        spData['token'] = $('#goldcointoken').val();
        spData['Goldcoin'] = $('#coinadds').val();
        socket.emit('request', { action: 'Coin-add', spData });
    };

    const Coinadd = document.getElementById('Coinadd');
    if (Coinadd) {
        Coinadd.addEventListener('click', GCA);
    }

    const GCRD = () => {
        var spData = {};
        spData['token'] = $('#goldremovetoken').val();
        spData['Goldcoin'] = $('#goldcoinremove').val();
        socket.emit('request', { action: 'Gold-coin-remove', spData });
    };

    const Goldcoinremove = document.getElementById('Goldcoinremove');
    if (Goldcoinremove) {
        Goldcoinremove.addEventListener('click', GCRD);
    }

    const CAD = () => {
        var spData = {};
        spData['token'] = $('#cashadd').val();
        spData['cash'] = $('#cashamount').val();
        socket.emit('request', { action: 'cash-add', spData });
    };

    const cashadd = document.getElementById('cashadd');
    if (cashadd) {
        cashadd.addEventListener('click', CAD);
    }

    const CRA = () => {
        var spData = {};
        spData['token'] = $('#cashtokens').val();
        spData['cash'] = $('#cashremov').val();
        socket.emit('request', { action: 'cash-remove', spData });
    };

    const cashremove = document.getElementById('cashremove');
    if (cashremove) {
        cashremove.addEventListener('click', CRA);
    }
});
