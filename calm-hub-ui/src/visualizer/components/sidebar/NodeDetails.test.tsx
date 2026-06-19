import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NodeDetails } from './NodeDetails.js';
import { CalmNodeSchema } from '@finos/calm-models/types';

const baseNode: CalmNodeSchema = {
    'unique-id': 'node-001',
    name: 'My Service',
    'node-type': 'service',
    description: 'A service node',
};

describe('NodeDetails', () => {
    it('renders node name, unique-id, and description', () => {
        render(<NodeDetails data={baseNode} />);

        expect(screen.getByText('My Service')).toBeInTheDocument();
        expect(screen.getByText('node-001')).toBeInTheDocument();
        expect(screen.getByText('A service node')).toBeInTheDocument();
    });

    it('renders the node type badge', () => {
        render(<NodeDetails data={baseNode} />);

        expect(screen.getByText('service')).toBeInTheDocument();
    });

    it('renders interfaces when present', () => {
        const nodeWithInterfaces: CalmNodeSchema = {
            ...baseNode,
            interfaces: [
                { 'unique-id': 'iface-1', host: 'localhost', port: 8080 },
            ],
        };
        render(<NodeDetails data={nodeWithInterfaces} />);

        expect(screen.getByText('Interfaces')).toBeInTheDocument();
        expect(screen.getByText('iface-1')).toBeInTheDocument();
        expect(screen.getByText('localhost')).toBeInTheDocument();
    });

    it('renders controls when present', () => {
        const nodeWithControls: CalmNodeSchema = {
            ...baseNode,
            controls: {
                'security-review': {
                    description: 'Must pass security review',
                    requirements: [{ 'requirement-url': 'https://example.com' }],
                },
            },
        };
        render(<NodeDetails data={nodeWithControls} />);

        expect(screen.getByText('Controls')).toBeInTheDocument();
        expect(screen.getByText('security-review')).toBeInTheDocument();
        expect(screen.getByText('Must pass security review')).toBeInTheDocument();
        expect(screen.getByText('1 requirement')).toBeInTheDocument();
    });

    it('renders risk level badge when aigf metadata present', () => {
        const nodeWithRisk: CalmNodeSchema = {
            ...baseNode,
            metadata: {
                aigf: {
                    'risk-level': 'high',
                    risks: ['Data breach risk'],
                },
            },
        };
        render(<NodeDetails data={nodeWithRisk} />);

        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('Risks')).toBeInTheDocument();
        expect(screen.getByText('Data breach risk')).toBeInTheDocument();
    });

    it('renders mitigations when present in aigf metadata', () => {
        const nodeWithMitigations: CalmNodeSchema = {
            ...baseNode,
            metadata: {
                aigf: {
                    mitigations: ['Encryption at rest'],
                },
            },
        };
        render(<NodeDetails data={nodeWithMitigations} />);

        expect(screen.getByText('Mitigations')).toBeInTheDocument();
        expect(screen.getByText('Encryption at rest')).toBeInTheDocument();
    });

    it('renders detailed architecture label and reference value when present', () => {
        const nodeWithDetails: CalmNodeSchema = {
            ...baseNode,
            details: { 'detailed-architecture': 'api-platform.json' },
        };
        render(<NodeDetails data={nodeWithDetails} />);

        expect(screen.getByText('Detailed Architecture')).toBeInTheDocument();
        expect(screen.getByText('api-platform.json')).toBeInTheDocument();
    });

    it('renders detailed architecture as a clickable button when reference is a CALM Hub path', async () => {
        const user = userEvent.setup();
        const onNavigate = vi.fn();
        const nodeWithDetails: CalmNodeSchema = {
            ...baseNode,
            details: { 'detailed-architecture': '/calm/namespaces/finos/architectures/2/versions/1-0-0' },
        };
        render(<NodeDetails data={nodeWithDetails} onNavigateToDetailedArch={onNavigate} />);

        const btn = screen.getByRole('button', { name: '/calm/namespaces/finos/architectures/2/versions/1-0-0' });
        expect(btn).toBeInTheDocument();
        await user.click(btn);
        expect(onNavigate).toHaveBeenCalledWith('/calm/namespaces/finos/architectures/2/versions/1-0-0');
    });

    it('renders detailed architecture as a link when reference is an http URL', () => {
        const nodeWithDetails: CalmNodeSchema = {
            ...baseNode,
            details: { 'detailed-architecture': 'https://calm.finos.org/calm/namespaces/finos/architectures/2/versions/1.0.0' },
        };
        render(<NodeDetails data={nodeWithDetails} />);

        const link = screen.getByRole('link', { name: 'https://calm.finos.org/calm/namespaces/finos/architectures/2/versions/1.0.0' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders extra properties not in the known set', () => {
        const nodeWithExtra = {
            ...baseNode,
            'custom-field': 'custom-value',
        } as CalmNodeSchema;
        render(<NodeDetails data={nodeWithExtra} />);

        expect(screen.getByText('Properties')).toBeInTheDocument();
        expect(screen.getByText('Custom Field')).toBeInTheDocument();
        expect(screen.getByText('custom-value')).toBeInTheDocument();
    });
});
