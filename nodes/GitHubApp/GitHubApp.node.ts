import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { genToken } from '../../credentials/GitHubAppApi.credentials';

export class GitHubApp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Application token',
		name: 'gitHubApp',
		icon: { light: 'file:ghapp.svg', dark: 'file:ghapp.svg' },
		group: ['transform'],
		version: 1,
		subtitle: 'Generate GitHub Application token',
		description: 'Generate GitHub Application token',
		defaults: {
			name: 'Application Token',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'githubappApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Installation',
				name: 'installation',
				type: 'string',
				default: '',
				description: 'The installation to generate credentials for. Can be an organization, full-name repository, or installation ID. Defaults to the installation in the credential.'
			},
			{
				displayName: 'Force Token Generation',
				name: 'force',
				type: 'boolean',
				default: false,
				description: 'Whether to force generation of the token, bypassing the cache'
			}
		]
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const creds = await this.getCredentials('githubappApi')
		const force = this.getNodeParameter('force', 0, false) as boolean
		const ovInst = this.getNodeParameter('installation', 0, '') as string
		const token = await genToken(creds, force, ovInst.trim().length == 0 ? undefined : ovInst)
		return [[{json:{token}}]]
	}
}
