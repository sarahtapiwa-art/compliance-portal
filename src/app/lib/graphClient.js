import { Client } from '@microsoft/microsoft-graph-client';

export const getAuthenticatedClient = (accessToken) => {
    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });
};

export const sendEmail = async (accessToken, emailData) => {
    const client = getAuthenticatedClient(accessToken);

    const email = {
        message: {
            subject: emailData.subject,
            body: {
                contentType: emailData.contentType || 'HTML',
                content: emailData.body
            },
            toRecipients: emailData.toRecipients.map(recipient => ({
                emailAddress: {
                    address: recipient
                }
            })),
            ccRecipients: emailData.ccRecipients?.map(recipient => ({
                emailAddress: {
                    address: recipient
                }
            })),
            bccRecipients: emailData.bccRecipients?.map(recipient => ({
                emailAddress: {
                    address: recipient
                }
            }))
        },
        saveToSentItems: emailData.saveToSentItems || true
    };

    return await client
        .api('/me/sendMail')
        .post(email);
};

export const getUserProfile = async (accessToken) => {
    const client = getAuthenticatedClient(accessToken);
    return await client.api('/me').get();
};