<script lang="ts">
	import { db } from '$lib/firebase';
	import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

	interface Participant {
		id: string;
		name: string;
		count: number;
	}

	let participants = $state<Participant[]>([]);
	let isLoading = $state(true);
	let errorMsg = $state("");
	let debugInfo = $state({ size: -1, projectId: "" });

	$effect(() => {
		// Pega o projectId configurado para garantirmos que estamos no projeto certo
		debugInfo.projectId = db.app.options.projectId || "desconhecido";

		const unsubscribe = onSnapshot(collection(db, 'participants'), (snapshot) => {
			let data: Participant[] = [];
			debugInfo.size = snapshot.size; // Salva quantos docs o Firebase retornou
			
			snapshot.forEach((docSnap) => {
				const d = docSnap.data();
				data.push({ 
					id: docSnap.id, 
					name: d.name || docSnap.id, 
					count: typeof d.count === 'number' ? d.count : 0 
				} as Participant);
			});
			
			participants = data.sort((a, b) => b.count - a.count);
			isLoading = false;
			errorMsg = "";
		}, (error) => {
			console.error("Erro ao buscar dados do Firebase:", error);
			errorMsg = "Sem permissão ou erro de rede (" + error.message + ")";
			isLoading = false;
		});

		return () => unsubscribe();
	});

	function isLeader(id: string) {
		if (participants.length === 0) return false;
		const highestCount = participants[0].count;
		if (highestCount === 0) return false;
		
		const p = participants.find(p => p.id === id);
		return p?.count === highestCount;
	}

	async function addDiminutive(id: string) {
		try {
			const pRef = doc(db, 'participants', id);
			await updateDoc(pRef, { count: increment(1) });
		} catch (e: any) {
			console.error("Erro ao incrementar:", e);
			alert("Erro ao salvar: " + e.message);
		}
	}
</script>

<main class="container">
	<h1 class="title">Contador-inho 🤏</h1>
	<p class="rules">
		A regra é clara: soltou um "inho" ou "inha", o placar sobe. Reseta toda segunda-feira!
	</p>

	{#if errorMsg}
		<div class="error-box">
			⚠️ {errorMsg}
			<br><small>Verifique as regras do Firestore no console.</small>
		</div>
	{/if}

	{#if isLoading}
		<p class="loading">Carregando o placar...</p>
	{:else}
		{#if participants.length === 0 && !errorMsg}
			<p class="empty">Nenhum participante encontrado.</p>
			
			<!-- CAIXA DE DEBUG PARA DESCOBRIR O MISTÉRIO -->
			<div class="debug-box">
				<strong>🔎 Debug Info:</strong><br>
				Projeto Firebase conectado: <code>{debugInfo.projectId}</code><br>
				Documentos encontrados na coleção 'participants': <code>{debugInfo.size}</code>
			</div>
		{/if}

		<ul class="participant-list">
			{#each participants as person (person.id)}
				<li class="participant">
					<span class="name">
						{person.name}
						{#if isLeader(person.id)}
							<span class="leader-icon" title="Líder">👑</span>
						{/if}
					</span>

					<div class="count-wrapper">
						<span class="count">{person.count}</span>
						<button onclick={() => addDiminutive(person.id)} class="flag-btn">
							Flagrado! 🚨
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Inter', system-ui, sans-serif;
		background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
		color: #f8fafc;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 4rem;
	}

	.container {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		padding: 2.5rem;
		width: 100%;
		max-width: 550px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.title {
		text-align: center;
		margin-top: 0;
		margin-bottom: 0.5rem;
		font-size: 2.2rem;
		background: -webkit-linear-gradient(45deg, #38bdf8, #818cf8);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.rules {
		font-size: 1.05rem;
		line-height: 1.5;
		color: #94a3b8;
		margin-bottom: 2rem;
		text-align: center;
	}

	.error-box {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		padding: 1rem;
		border-radius: 12px;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.debug-box {
		margin-top: 1.5rem;
		padding: 1rem;
		background: rgba(0,0,0,0.4);
		border: 1px dashed #64748b;
		border-radius: 8px;
		color: #cbd5e1;
		font-size: 0.9rem;
	}
	.debug-box code {
		color: #38bdf8;
		font-weight: bold;
	}

	.empty {
		text-align: center;
		color: #94a3b8;
		font-style: italic;
	}

	.participant-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.participant {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.05);
		padding: 1rem 1.5rem;
		border-radius: 16px;
		transition: transform 0.2s, background 0.2s;
	}

	.participant:hover {
		transform: translateY(-2px);
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.name {
		font-size: 1.3rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-transform: capitalize;
	}

	.leader-icon {
		font-size: 1.2rem;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-25%); }
	}

	.count-wrapper {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.count {
		font-size: 1.8rem;
		font-weight: 800;
		color: #38bdf8;
		min-width: 2rem;
		text-align: center;
	}

	.flag-btn {
		background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%);
		color: white;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: transform 0.15s, box-shadow 0.2s;
		box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
	}

	.flag-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
	}
	
	.flag-btn:active {
		transform: scale(0.95);
	}

	.loading {
		text-align: center;
		font-size: 1.2rem;
		color: #64748b;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
