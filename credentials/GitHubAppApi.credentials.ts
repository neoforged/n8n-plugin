import {
	ICredentialDataDecryptedObject,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import jwt from 'jsonwebtoken'
import { Octokit } from '@octokit/rest';

class AsyncCache<K, V> {
	private cache: Map<K, {
		value: V,
		expiry: number
	}>;

  constructor() {
    this.cache = new Map();
  }

  async get(key: K, creator: () => Promise<V>, timeout = 5000) {
    const now = Date.now();

    if (this.cache.has(key)) {
      const { value, expiry } = this.cache.get(key)!
      if (expiry > now) {
        return value;
      }
      this.cache.delete(key)
    }

    const value = await creator()
    this.cache.set(key, { value, expiry: now + timeout });
    return value;
  }
}

const tokenCache = new AsyncCache<string, string>()

export async function genToken(creds: ICredentialDataDecryptedObject, forceGenerate: boolean = false, ovInstallation: string | undefined = undefined): Promise<string> {
	const key = creds['key'] as string
	const appid = creds['appid'] as number
	const installation = ovInstallation ?? creds['installation'] as string
	const generator = async () => {
		console.log('Generating GH application token for ' + appid)

		const now = Math.floor(Date.now() / 1000)

		const octo = new Octokit({
			auth: jwt.sign({
				iss: appid.toString(),
				iat: now,
				exp: now + 599
			}, formatPrivateKey(key), {
				algorithm: 'RS256'
			})
		})

		let install: number

		if (isNaN(Number(installation))) {
			if (installation.includes('/')) {
				const split = installation.split('/')
				install = (await octo.apps.getRepoInstallation({owner: split[0], repo: split[1]})).data.id
			} else {
				install = (await octo.apps.getOrgInstallation({org: installation})).data.id
			}
		} else {
			install = parseInt(installation)
		}
		return (await octo.apps.createInstallationAccessToken({
			installation_id: install
		})).data.token
	}
	if (forceGenerate) return await generator()
	return await tokenCache.get(JSON.stringify([key, appid, installation]), generator, 45 * 60 * 1000) // 45 minutes
}

export class GitHubAppApi implements ICredentialType {
	name = 'githubappApi';
	displayName = 'GitHub Application API';
	documentationUrl = 'https://docs.github.com/en/apps';
	icon = { light: 'file:ghapp.svg', dark: 'file:ghapp.svg'} as const
	properties: INodeProperties[] = [
		{
			displayName: 'Private key',
			description: 'The application private key',
			name: 'key',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			}
		},
		{
			displayName: 'Application ID',
			description: 'The ID of the GitHub application',
			name: 'appid',
			type: 'number',
			default: 0,
			required: true
		},
		{
			displayName: 'Installation',
			description: 'The installation (organisation or repository) to generate application tokens for by default',
			name: 'installation',
			type: 'string',
			default: ''
		}
	];


	authenticate = async (creds: ICredentialDataDecryptedObject, req: IHttpRequestOptions): Promise<IHttpRequestOptions> => {
		return {
			...req,
			headers: {
				...req.headers,
				'Authorization': `Bearer ${await genToken(creds)}`
			}
		}
	}
}

export function formatPrivateKey(privateKey: string): string {
	let regex = /(PRIVATE KEY|CERTIFICATE)/;
	if (!privateKey || /\n/.test(privateKey)) {
		return privateKey;
	}
	let formattedPrivateKey = '';
	const parts = privateKey.split('-----').filter((item) => item !== '');
	parts.forEach((part) => {
		if (regex.test(part)) {
			formattedPrivateKey += `-----${part}-----`;
		} else {
			const passRegex = /Proc-Type|DEK-Info/;
			if (passRegex.test(part)) {
				part = part.replace(/:\s+/g, ':');
				formattedPrivateKey += part.replace(/\\n/g, '\n').replace(/\s+/g, '\n');
			} else {
				formattedPrivateKey += part.replace(/\\n/g, '\n').replace(/\s+/g, '\n');
			}
		}
	});
	return formattedPrivateKey;
}
