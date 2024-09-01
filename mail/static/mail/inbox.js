document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //sent mail
  document.querySelector('#submit').addEventListener('click', function(event) {
    sentmail(event);
  });

  // By default, load the inbox
  load_mailbox('inbox');
});


function sentmail(e) {
  e.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  fetch('/emails', {
    method: 'POST',
    headers:{
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });

  load_mailbox('sent')
}


function showmail(email_id) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-mail-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    
    document.querySelector('#sender').innerHTML = `<b>From: </b>${email.sender}`;
    document.querySelector('#receiver').innerHTML = `<b>To: </b>${email.recipients}`;
    document.querySelector('#subject').innerHTML = `<b>Subject: </b>${email.subject}`;
    document.querySelector('#timestamp').innerHTML = `<b>Timestamp: </b>${email.timestamp}`;
    document.querySelector('#mail-body').innerHTML = `${email.body}`;


    /* deal with archive zone */
    var archivable = document.querySelector('#mail-archivable');
    archivable.innerHTML = "";

    /* if non-archive*/
    if (email.archived === false) {
      var addArchiveButton = document.createElement('button');
      addArchiveButton.setAttribute("class", "btn btn-secondary btn-sm");
      addArchiveButton.setAttribute("id", "add-archive");
      addArchiveButton.setAttribute("onClick", `add_archive(${email.id})`);
      addArchiveButton.innerHTML = "Add Archive";
      archivable.append(addArchiveButton);
    }
    else {
      /* if archived already */
    var removeArchiveButton = document.createElement('button');
    removeArchiveButton.setAttribute("class", "btn btn-light btn-sm");
    removeArchiveButton.setAttribute("id", "remove-archive");
    removeArchiveButton.setAttribute("style", "border: 1px solid grey; border-radius: 3px; margin-left: 3px;")
    removeArchiveButton.setAttribute("onClick", `remove_archive(${email.id})`);
    removeArchiveButton.innerHTML = "Remove Archive"
    archivable.append(removeArchiveButton);
    }

    /*chage read status*/
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })

    configure_reply(email.sender, email.subject, email.body, email.timestamp);

    /*<button class="btn btn-secondary btn-sm" id= onClick='add_archive'>Add Archive</button>
            <button class="btn btn-light btn-sm" id="remove-archive" style="border: 1px solid grey; border-radius: 3px; margin-left: 3px;">Remove Archive</button>
    */
  })

}


function configure_reply(reply_to, subject, body, timestamp) {
  document.querySelector('#reply').addEventListener('click', function() {

    compose_email();

    recipient = document.querySelector('#compose-recipients');
    recipient.disabled = "";
    recipient.value = reply_to;
    
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
    document.querySelector('#compose-body').value = `On ${timestamp} ${reply_to} wrote: ${body}`;
  })
}


function add_archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: true
    })
  })  
  load_mailbox("inbox");
}


function remove_archive(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })  
  load_mailbox("archive");

}


function compose_email() {
  
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-mail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#section-header').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    if (mailbox === "sent") {
      document.querySelector('#table-header').innerHTML = "Recipient";
    }
    else {
      document.querySelector('#table-header').innerHTML = "Sender";
    }

    var node = document.querySelector("#mail-list");
    node.innerHTML = "";

    for (let email of emails) {

      var id = email.id;
      var sender = email.sender;
      var recipients = email.recipients;
      var subject = email.subject;
      var timestamp = email.timestamp;
      
      if (email.read === true) {
        read_status = "readed";
      }
      else {
        read_status = "unreaded";
      }

      var new_node = document.createElement('tr');
      new_node.setAttribute("class", `${read_status}`);

      var data_subject = `<td><a href='#' id='${id}' onClick='showmail(${id})'>${subject}</a></td>`;
      var data_timestamp = `<td>${timestamp}</td>`;
      var data_read = `<td>${read_status}</td>`;
      var data_sender;

      if (mailbox === "sent") {
        data_sender = `<td>${recipients}</td>`;
      }
      else {
        data_sender = `<td>${sender}</td>`;
      }
      
      new_node.innerHTML = data_subject + data_sender + data_timestamp + data_read;

      node.appendChild(new_node);
    }
});
}